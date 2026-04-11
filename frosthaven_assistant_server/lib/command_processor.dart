import 'dart:convert';

/// Condition name to enum index mapping (matches Flutter's Condition enum in enums.dart)
const Map<String, int> _conditionIndex = {
  'stun': 0,
  'immobilize': 1,
  'disarm': 2,
  'wound': 3,
  'wounded': 3,
  'muddle': 5,
  'poison': 6,
  'poisoned': 6,
  'bane': 10,
  'brittle': 11,
  'chill': 12,
  'infect': 13,
  'impair': 14,
  'strengthen': 17,
  'invisible': 18,
  'regenerate': 19,
  'ward': 20,
  'bless': 24,
  'curse': 25,
};

/// Applies a web command to the current game state JSON.
///
/// Returns the modified JSON string, or null if the state
/// could not be modified (empty state, character not found, etc).
String? applyCommand(Map<String, dynamic> command, String currentStateJson) {
  if (currentStateJson.isEmpty) {
    print('Command processor: no game state to modify');
    return null;
  }

  final Map<String, dynamic> state;
  try {
    state = jsonDecode(currentStateJson) as Map<String, dynamic>;
  } catch (e) {
    print('Command processor: failed to parse game state: $e');
    return null;
  }

  final currentList = state['currentList'] as List<dynamic>?;
  if (currentList == null) {
    print('Command processor: no currentList in game state');
    return null;
  }

  final characterId = command['characterId'] as String;
  final action = command['action'] as String;

  // Find the character in currentList by id
  final characterIndex = currentList.indexWhere(
    (item) => item is Map<String, dynamic> && item['id'] == characterId,
  );

  if (characterIndex == -1) {
    print('Command processor: character "$characterId" not found');
    return null;
  }

  final character = currentList[characterIndex] as Map<String, dynamic>;
  final characterState = character['characterState'] as Map<String, dynamic>?;
  if (characterState == null) {
    print('Command processor: character "$characterId" has no characterState');
    return null;
  }

  switch (action) {
    case 'changeHealth':
      final value = command['value'] as num;
      final currentHealth = (characterState['health'] as num?) ?? 0;
      characterState['health'] = currentHealth + value;

    case 'setInitiative':
      final value = command['value'] as num;
      characterState['initiative'] = value;

    case 'addXP':
      final value = command['value'] as num;
      final currentXP = (characterState['xp'] as num?) ?? 0;
      characterState['xp'] = currentXP + value;

    case 'addStatusEffect':
      final effect = command['effect'] as String;
      final effectIndex = _conditionIndex[effect];
      if (effectIndex == null) {
        print('Command processor: unknown condition "$effect"');
        return null;
      }
      final conditions = characterState['conditions'] as List<dynamic>? ?? [];
      if (!conditions.contains(effectIndex)) {
        conditions.add(effectIndex);
        characterState['conditions'] = conditions;
      }

    case 'removeStatusEffect':
      final effect = command['effect'] as String;
      final effectIndex = _conditionIndex[effect];
      if (effectIndex == null) {
        print('Command processor: unknown condition "$effect"');
        return null;
      }
      final conditions = characterState['conditions'] as List<dynamic>? ?? [];
      conditions.remove(effectIndex);
      characterState['conditions'] = conditions;

    default:
      print('Command processor: unknown action "$action"');
      return null;
  }

  return jsonEncode(state);
}
