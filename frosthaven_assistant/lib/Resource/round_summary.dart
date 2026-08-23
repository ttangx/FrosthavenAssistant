import 'dart:convert';
import 'dart:math';

import 'package:frosthaven_assistant/Resource/enums.dart';
import 'package:frosthaven_assistant/Resource/state/game_state.dart';

enum FigureChangeKind { changed, added, removed }

class FigureRoundChange {
  const FigureRoundChange({
    required this.figureId,
    required this.displayName,
    required this.kind,
    this.healthDelta,
    this.xpDelta,
    this.conditionsAdded = const [],
    this.conditionsRemoved = const [],
  });

  final String figureId;
  final String displayName;
  final FigureChangeKind kind;
  final int? healthDelta;
  final int? xpDelta;
  final List<Condition> conditionsAdded;
  final List<Condition> conditionsRemoved;
}

class RoundSummary {
  const RoundSummary({required this.round, required this.changes});

  final int round;
  final List<FigureRoundChange> changes;
}

List<RoundSummary> buildRoundSummaries(GameState gameState) {
  final saveStates = gameState.gameSaveStates;
  final appliedStateCount = min(
    gameState.commandIndex.value + 2,
    saveStates.length,
  );
  final serializedStates = <String>[];
  for (int index = 0; index < appliedStateCount; index++) {
    final saveState = saveStates[index];
    if (saveState != null) serializedStates.add(saveState.getState());
  }
  return buildRoundSummariesFromSerializedStates(serializedStates);
}

List<RoundSummary> buildRoundSummariesFromSerializedStates(
  Iterable<String> serializedStates,
) {
  final states = serializedStates.map(_RoundSnapshot.fromJson).toList();
  if (states.length < 2) return const [];

  final summaries = <RoundSummary>[];
  var roundStart = states.first;
  for (int index = 1; index < states.length; index++) {
    final state = states[index];
    if (state.round == roundStart.round) continue;

    summaries.add(
      RoundSummary(
        round: roundStart.round,
        changes: _compareFigures(roundStart.figures, state.figures),
      ),
    );
    roundStart = state;
  }

  return summaries.reversed.toList(growable: false);
}

List<FigureRoundChange> _compareFigures(
  Map<String, _FigureSnapshot> before,
  Map<String, _FigureSnapshot> after,
) {
  final changes = <FigureRoundChange>[];
  final figureIds = {...before.keys, ...after.keys}.toList()
    ..sort((left, right) {
      final leftName = (after[left] ?? before[left])?.displayName ?? left;
      final rightName = (after[right] ?? before[right])?.displayName ?? right;
      return leftName.compareTo(rightName);
    });

  for (final figureId in figureIds) {
    final oldFigure = before[figureId];
    final newFigure = after[figureId];
    if (oldFigure == null && newFigure != null) {
      changes.add(
        FigureRoundChange(
          figureId: figureId,
          displayName: newFigure.displayName,
          kind: FigureChangeKind.added,
        ),
      );
      continue;
    }
    if (oldFigure != null && newFigure == null) {
      changes.add(
        FigureRoundChange(
          figureId: figureId,
          displayName: oldFigure.displayName,
          kind: FigureChangeKind.removed,
        ),
      );
      continue;
    }
    if (oldFigure == null || newFigure == null) continue;

    final healthDelta = newFigure.health == oldFigure.health
        ? null
        : newFigure.health - oldFigure.health;
    final xpDelta =
        oldFigure.xp == null ||
            newFigure.xp == null ||
            newFigure.xp == oldFigure.xp
        ? null
        : newFigure.xp! - oldFigure.xp!;
    final conditionsAdded = _conditionDifference(
      newFigure.conditions,
      oldFigure.conditions,
    );
    final conditionsRemoved = _conditionDifference(
      oldFigure.conditions,
      newFigure.conditions,
    );

    if (healthDelta != null ||
        xpDelta != null ||
        conditionsAdded.isNotEmpty ||
        conditionsRemoved.isNotEmpty) {
      changes.add(
        FigureRoundChange(
          figureId: figureId,
          displayName: newFigure.displayName,
          kind: FigureChangeKind.changed,
          healthDelta: healthDelta,
          xpDelta: xpDelta,
          conditionsAdded: conditionsAdded,
          conditionsRemoved: conditionsRemoved,
        ),
      );
    }
  }

  return List.unmodifiable(changes);
}

List<Condition> _conditionDifference(
  List<Condition> values,
  List<Condition> valuesToRemove,
) {
  final remaining = List<Condition>.of(values);
  for (final value in valuesToRemove) {
    remaining.remove(value);
  }
  remaining.sort((left, right) => left.index.compareTo(right.index));
  return List.unmodifiable(remaining);
}

class _RoundSnapshot {
  const _RoundSnapshot({required this.round, required this.figures});

  factory _RoundSnapshot.fromJson(String value) {
    final json = jsonDecode(value) as Map<String, dynamic>;
    final figures = <String, _FigureSnapshot>{};
    for (final item in (json['currentList'] as List).cast<Map>()) {
      final itemJson = item.cast<String, dynamic>();
      if (itemJson['characterClass'] != null) {
        _addCharacter(figures, itemJson);
      } else if (itemJson['type'] != null) {
        _addMonsterInstances(figures, itemJson);
      }
    }
    return _RoundSnapshot(round: json['round'] as int, figures: figures);
  }

  final int round;
  final Map<String, _FigureSnapshot> figures;

  static void _addCharacter(
    Map<String, _FigureSnapshot> figures,
    Map<String, dynamic> item,
  ) {
    final ownerId = item['id'] as String;
    final state = (item['characterState'] as Map).cast<String, dynamic>();
    final display = state['display'] as String?;
    figures['character:$ownerId'] = _FigureSnapshot(
      displayName: display == null || display.isEmpty ? ownerId : display,
      health: state['health'] as int,
      xp: state['xp'] as int,
      conditions: _conditionsFromJson(state['conditions']),
    );

    for (final summon in (state['summonList'] as List).cast<Map>()) {
      final summonJson = summon.cast<String, dynamic>();
      final standeeNr = summonJson['standeeNr'] as int;
      final name = summonJson['name'] as String;
      final gfx = summonJson['gfx'] as String;
      figures['summon:$ownerId:$name:$gfx:$standeeNr'] = _FigureSnapshot(
        displayName: '$name $standeeNr',
        health: summonJson['health'] as int,
        conditions: _conditionsFromJson(summonJson['conditions']),
      );
    }
  }

  static void _addMonsterInstances(
    Map<String, _FigureSnapshot> figures,
    Map<String, dynamic> item,
  ) {
    final ownerId = item['id'] as String;
    for (final instance in (item['monsterInstances'] as List).cast<Map>()) {
      final instanceJson = instance.cast<String, dynamic>();
      final standeeNr = instanceJson['standeeNr'] as int;
      final name = instanceJson['name'] as String;
      figures['monster:$ownerId:$standeeNr'] = _FigureSnapshot(
        displayName: '$name $standeeNr',
        health: instanceJson['health'] as int,
        conditions: _conditionsFromJson(instanceJson['conditions']),
      );
    }
  }

  static List<Condition> _conditionsFromJson(Object? value) {
    final conditions = <Condition>[];
    for (final index in (value as List).cast<int>()) {
      if (index >= 0 && index < Condition.values.length) {
        conditions.add(Condition.values[index]);
      }
    }
    return conditions;
  }
}

class _FigureSnapshot {
  const _FigureSnapshot({
    required this.displayName,
    required this.health,
    required this.conditions,
    this.xp,
  });

  final String displayName;
  final int health;
  final int? xp;
  final List<Condition> conditions;
}
