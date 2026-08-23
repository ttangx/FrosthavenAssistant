import 'package:frosthaven_assistant_server/game_server.dart';
import 'package:test/test.dart';

void main() {
  group('GameServer.tryExtractState', () {
    test('extracts state from the canonical JSON envelope', () {
      final message = GameServer.encodeStateEnvelope(
        index: 2,
        description: 'draw',
        eventJson: '{"type":"none"}',
        state: '{"round":1}',
      );

      expect(GameServer.tryExtractState(message), '{"round":1}');
    });

    test('extracts state from a mismatch JSON envelope', () {
      final message = GameServer.encodeStateEnvelope(
        index: 3,
        description: 'server correction',
        eventJson: '{"type":"none"}',
        state: '{"round":2}',
      );

      expect(GameServer.tryExtractState('Mismatch:$message'), '{"round":2}');
    });

    test('keeps legacy state messages readable during deployment overlap', () {
      const message =
          'Index:4Description:change healthGameState:{"round":3}';

      expect(GameServer.tryExtractState(message), '{"round":3}');
    });

    test('returns an empty state from a valid envelope', () {
      final message = GameServer.encodeStateEnvelope(
        index: -1,
        description: '',
        eventJson: '{"type":"none"}',
        state: '',
      );

      expect(GameServer.tryExtractState(message), '');
    });

    test('rejects malformed and non-state messages', () {
      expect(GameServer.tryExtractState('{broken json'), isNull);
      expect(GameServer.tryExtractState('{"type":"pong"}'), isNull);
      expect(GameServer.tryExtractState('ping'), isNull);
    });
  });
}
