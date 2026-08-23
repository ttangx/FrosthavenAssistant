import 'dart:convert';
import 'dart:io';

import 'package:frosthaven_assistant_server/game_server.dart';
import 'package:frosthaven_assistant_server/standalone_server.dart';
import 'package:test/test.dart';

void main() {
  test('web commands broadcast the canonical JSON state envelope', () async {
    final listener = await ServerSocket.bind(InternetAddress.loopbackIPv4, 0);
    final serverPeerFuture = listener.first;
    final client = await Socket.connect(listener.address, listener.port);
    final serverPeer = await serverPeerFuture;
    final server = StandaloneServer();
    final broadcasts = <String>[];
    server.onStateBroadcast = broadcasts.add;

    addTearDown(() async {
      client.destroy();
      serverPeer.destroy();
      await listener.close();
    });

    final seed = StateUpdateMessage()
      ..index = 0
      ..indexString = '0'
      ..description = 'seed'
      ..eventJson = '{"type":"none"}'
      ..data = jsonEncode({
        'currentList': [
          {
            'id': 'Drifter',
            'characterState': {'health': 10},
          },
        ],
      });
    server.updateStateFromMessage(seed, serverPeer);
    broadcasts.clear();

    final applied = server.applyWebCommand(
      {'action': 'changeHealth', 'characterId': 'Drifter', 'value': -1},
      'Drifter: change health by -1',
    );

    expect(applied, isTrue);
    expect(broadcasts, hasLength(1));
    final envelope = GameServer.tryDecodeStateEnvelope(broadcasts.single);
    expect(envelope, isNotNull);
    expect(envelope!.index, 1);
    expect(envelope.description, 'Drifter: change health by -1');
    expect(jsonDecode(envelope.data), {
      'currentList': [
        {
          'id': 'Drifter',
          'characterState': {'health': 9},
        },
      ],
    });
  });
}
