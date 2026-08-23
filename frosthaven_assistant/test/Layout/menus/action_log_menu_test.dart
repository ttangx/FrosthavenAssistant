// ignore_for_file: no-magic-number, avoid-late-keyword

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frosthaven_assistant/Layout/menus/action_log_menu.dart';
import 'package:frosthaven_assistant/Resource/commands/add_character_command.dart';
import 'package:frosthaven_assistant/Resource/commands/add_monster_command.dart';
import 'package:frosthaven_assistant/Resource/enums.dart';
import 'package:frosthaven_assistant/Resource/round_summary.dart';
import 'package:frosthaven_assistant/Resource/state/game_state.dart';
import 'package:frosthaven_assistant/l10n/app_localizations.dart';
import 'package:frosthaven_assistant/services/service_locator.dart';

import '../../command/test_helpers.dart';

void main() {
  setUpAll(() async {
    await setUpGame();
  });

  GameState gs() => getIt<GameState>();

  setUp(() {
    gs().clearList();
    gs().resetCommandHistory();
  });

  Future<void> pump(
    WidgetTester tester, {
    List<RoundSummary>? roundSummaries,
  }) async {
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
        ],
        supportedLocales: const [Locale('en')],
        home: Scaffold(
          body: ActionLogMenu(gameState: gs(), roundSummaries: roundSummaries),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('lists recent actions, newest action present', (tester) async {
    gs().action(AddCharacterCommand('Blinkblade', 'Frosthaven', 'Blinky', 1));
    gs().action(AddMonsterCommand('Zealot', 1, false, gameState: gs()));

    final descriptions = gs().commandDescriptions;
    expect(descriptions.length >= 2, true);

    await pump(tester);

    // Both the newest and previous actions render (using the exact stored
    // descriptions, so this is robust to wording/localisation).
    expect(find.text(descriptions.last), findsOneWidget);
    expect(find.text(descriptions[descriptions.length - 2]), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('shows empty state when there are no actions', (tester) async {
    await pump(tester);
    expect(find.text('No actions yet'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('shows actions and round summary tabs', (tester) async {
    await pump(tester, roundSummaries: const []);

    expect(find.text('Actions'), findsOneWidget);
    expect(find.text('Round Summary'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('renders net changes for a completed round', (tester) async {
    await pump(
      tester,
      roundSummaries: const [
        RoundSummary(
          round: 3,
          changes: [
            FigureRoundChange(
              figureId: 'character:blinkblade',
              displayName: 'Blinky',
              kind: FigureChangeKind.changed,
              healthDelta: -2,
              xpDelta: 1,
              conditionsAdded: [Condition.poison],
              conditionsRemoved: [Condition.wound],
            ),
            FigureRoundChange(
              figureId: 'monster:zealot:2',
              displayName: 'Zealot 2',
              kind: FigureChangeKind.added,
            ),
          ],
        ),
      ],
    );

    await tester.tap(find.text('Round Summary'));
    await tester.pumpAndSettle();

    expect(find.text('Round 3'), findsOneWidget);
    expect(find.text('Blinky'), findsOneWidget);
    expect(find.text('-2 HP'), findsOneWidget);
    expect(find.text('+1 XP'), findsOneWidget);
    expect(find.text('+Poison'), findsOneWidget);
    expect(find.text('-Wound'), findsOneWidget);
    expect(find.text('Zealot 2'), findsOneWidget);
    expect(find.text('Added'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('shows an empty state before any round is completed', (
    tester,
  ) async {
    await pump(tester, roundSummaries: const []);

    await tester.tap(find.text('Round Summary'));
    await tester.pumpAndSettle();

    expect(find.text('No completed rounds yet'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
