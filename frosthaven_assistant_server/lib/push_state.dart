import 'dart:async';
import 'dart:convert';
import 'push_sender.dart';

/// Manages push subscriptions and the "nag last player" timer.
class PushState {
  /// characterId -> push subscription JSON
  final Map<String, Map<String, dynamic>> _subscriptions = {};

  Timer? _nagTimer;
  String? _lastNaggedCharacterId;

  /// Register a push subscription for a character.
  void subscribe(String characterId, Map<String, dynamic> subscription) {
    _subscriptions[characterId] = subscription;
    print('Push: subscribed $characterId (${_subscriptions.length} total)');
  }

  /// Remove a push subscription.
  void unsubscribe(String characterId) {
    _subscriptions.remove(characterId);
    print('Push: unsubscribed $characterId');
  }

  /// Called whenever game state changes. Checks if one player is last
  /// to enter initiative and starts/stops nagging accordingly.
  void onStateChanged(String gameStateJson) {
    if (gameStateJson.isEmpty) {
      _stopNagging();
      return;
    }

    try {
      final state = jsonDecode(gameStateJson) as Map<String, dynamic>;
      final roundState = state['roundState'] as num? ?? 0;

      // Only nag during pre-draw phase
      if (roundState > 0) {
        _stopNagging();
        return;
      }

      final currentList = state['currentList'] as List<dynamic>? ?? [];
      final characters = currentList
          .where((item) => item is Map<String, dynamic> && item['characterState'] != null)
          .cast<Map<String, dynamic>>()
          .toList();

      if (characters.length < 2) {
        _stopNagging();
        return;
      }

      // Find characters without initiative (initiative == 0 means not set)
      final withoutInitiative = characters.where((c) {
        final cs = c['characterState'] as Map<String, dynamic>;
        final init = cs['initiative'] as num? ?? 0;
        return init == 0;
      }).toList();

      // If exactly one player hasn't set initiative, nag them
      if (withoutInitiative.length == 1) {
        final charId = withoutInitiative[0]['id'] as String;
        _startNagging(charId);
      } else {
        _stopNagging();
      }
    } catch (e) {
      print('Push: error checking state: $e');
    }
  }

  void _startNagging(String characterId) {
    if (_lastNaggedCharacterId == characterId && _nagTimer != null) {
      return; // Already nagging this player
    }

    _stopNagging();
    _lastNaggedCharacterId = characterId;

    final subscription = _subscriptions[characterId];
    if (subscription == null) {
      print('Push: no subscription for $characterId, skipping nag');
      return;
    }

    print('Push: starting nag timer for $characterId');

    // Send immediately, then every 15 seconds
    _sendNag(characterId, subscription);
    _nagTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _sendNag(characterId, subscription);
    });
  }

  void _stopNagging() {
    if (_nagTimer != null) {
      _nagTimer!.cancel();
      _nagTimer = null;
      if (_lastNaggedCharacterId != null) {
        print('Push: stopped nagging $_lastNaggedCharacterId');
      }
      _lastNaggedCharacterId = null;
    }
  }

  void _sendNag(String characterId, Map<String, dynamic> subscription) {
    sendPushNotification(
      subscription,
      'Frosthaven',
      'Waiting on your initiative!',
    );
  }

  void dispose() {
    _stopNagging();
  }
}
