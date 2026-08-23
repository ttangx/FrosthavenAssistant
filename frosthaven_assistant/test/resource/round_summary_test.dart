// ignore_for_file: no-magic-number

import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:frosthaven_assistant/Resource/enums.dart';
import 'package:frosthaven_assistant/Resource/round_summary.dart';

void main() {
  test('compares round start with the next round boundary', () {
    final summaries = buildRoundSummariesFromSerializedStates([
      _state(
        round: 1,
        figures: [
          _character(health: 10, xp: 1, conditions: [6]),
          _monster(health: 6),
        ],
      ),
      _state(
        round: 1,
        figures: [
          _character(health: 8, xp: 2, conditions: [6, 3]),
          _monster(health: 3),
        ],
      ),
      _state(
        round: 2,
        figures: [
          _character(health: 8, xp: 2, conditions: [3]),
        ],
      ),
      _state(
        round: 2,
        figures: [
          _character(health: 7, xp: 2, conditions: [3]),
        ],
      ),
    ]);

    expect(summaries, hasLength(1));
    expect(summaries.single.round, 1);

    final character = summaries.single.changes.singleWhere(
      (change) => change.figureId == 'character:blinkblade',
    );
    expect(character.displayName, 'Blinky');
    expect(character.kind, FigureChangeKind.changed);
    expect(character.healthDelta, -2);
    expect(character.xpDelta, 1);
    expect(character.conditionsAdded, [Condition.wound]);
    expect(character.conditionsRemoved, [Condition.poison]);

    final monster = summaries.single.changes.singleWhere(
      (change) => change.figureId == 'monster:zealot:1',
    );
    expect(monster.displayName, 'Zealot 1');
    expect(monster.kind, FigureChangeKind.removed);
  });

  test('reports figures added during a completed round', () {
    final summaries = buildRoundSummariesFromSerializedStates([
      _state(round: 4, figures: [_character()]),
      _state(round: 5, figures: [_character(), _monster(standeeNr: 2)]),
    ]);

    final added = summaries.single.changes.single;
    expect(added.figureId, 'monster:zealot:2');
    expect(added.kind, FigureChangeKind.added);
  });

  test('keeps completed rounds with no tracked changes', () {
    final summaries = buildRoundSummariesFromSerializedStates([
      _state(round: 2, figures: [_character()]),
      _state(round: 3, figures: [_character()]),
    ]);

    expect(summaries, hasLength(1));
    expect(summaries.single.round, 2);
    expect(summaries.single.changes, isEmpty);
  });

  test('tracks summons independently from their owning character', () {
    final summaries = buildRoundSummariesFromSerializedStates([
      _state(
        round: 2,
        figures: [
          _character(summons: [_summon(health: 5)]),
        ],
      ),
      _state(
        round: 3,
        figures: [
          _character(summons: [_summon(health: 2)]),
        ],
      ),
    ]);

    final summon = summaries.single.changes.single;
    expect(summon.figureId, 'summon:blinkblade:Shadow:shadow:1');
    expect(summon.displayName, 'Shadow 1');
    expect(summon.healthDelta, -3);
  });

  test(
    'returns completed rounds newest first and excludes the current round',
    () {
      final summaries = buildRoundSummariesFromSerializedStates([
        _state(round: 1, figures: [_character(health: 10)]),
        _state(round: 2, figures: [_character(health: 9)]),
        _state(round: 2, figures: [_character(health: 7)]),
        _state(round: 3, figures: [_character(health: 6)]),
        _state(round: 3, figures: [_character(health: 1)]),
      ]);

      expect(summaries.map((summary) => summary.round), [2, 1]);
      expect(summaries.first.changes.single.healthDelta, -3);
    },
  );
}

String _state({
  required int round,
  required List<Map<String, Object?>> figures,
}) {
  return jsonEncode({'round': round, 'currentList': figures});
}

Map<String, Object?> _character({
  int health = 10,
  int xp = 0,
  List<int> conditions = const [],
  List<Map<String, Object?>> summons = const [],
}) {
  return {
    'id': 'blinkblade',
    'characterClass': 'Blinkblade',
    'characterState': {
      'display': 'Blinky',
      'health': health,
      'xp': xp,
      'conditions': conditions,
      'summonList': summons,
    },
  };
}

Map<String, Object?> _summon({required int health}) {
  return {
    'standeeNr': 1,
    'name': 'Shadow',
    'gfx': 'shadow',
    'health': health,
    'conditions': <int>[],
  };
}

Map<String, Object?> _monster({int health = 6, int standeeNr = 1}) {
  return {
    'id': 'zealot',
    'type': 'Zealot',
    'monsterInstances': [
      {
        'standeeNr': standeeNr,
        'name': 'Zealot',
        'gfx': 'zealot',
        'health': health,
        'conditions': <int>[],
      },
    ],
  };
}
