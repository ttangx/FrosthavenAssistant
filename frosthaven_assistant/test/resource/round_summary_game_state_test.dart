// ignore_for_file: no-magic-number

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frosthaven_assistant/Resource/commands/add_character_command.dart';
import 'package:frosthaven_assistant/Resource/commands/next_round_command.dart';
import 'package:frosthaven_assistant/Resource/game_data.dart';
import 'package:frosthaven_assistant/Resource/round_summary.dart';
import 'package:frosthaven_assistant/Resource/settings.dart';
import 'package:frosthaven_assistant/Resource/state/game_state.dart';
import 'package:frosthaven_assistant/services/service_locator.dart';

import '../command/test_helpers.dart';

void main() {
  setUpAll(() async {
    await setUpGame();
  });

  test('uses only applied save states and ignores a redoable next round', () {
    final gameState = getIt<GameState>();
    gameState.clearList();
    (gameState.round as ValueNotifier<int>).value = 1;
    gameState.save();
    gameState.resetCommandHistory();
    gameState.commandIndex.value = -1;

    gameState.action(
      AddCharacterCommand('Blinkblade', 'Frosthaven', 'Blinky', 1),
    );
    gameState.action(
      NextRoundCommand(
        gameState: gameState,
        gameData: getIt<GameData>(),
        settings: getIt<Settings>(),
      ),
    );

    final completed = buildRoundSummaries(gameState);
    expect(completed, hasLength(1));
    expect(completed.single.round, 1);
    expect(completed.single.changes.single.figureId, 'character:Blinkblade');

    gameState.undo();

    expect(buildRoundSummaries(gameState), isEmpty);
  });
}
