import 'dart:convert';

/// Parses a JSON string from a web client into a Map.
///
/// Throws [FormatException] if the string is not valid JSON.
/// Throws [ArgumentError] if the parsed value is not a JSON object.
Map<String, dynamic> parseWebMessage(String jsonString) {
  final decoded = jsonDecode(jsonString);
  if (decoded is! Map<String, dynamic>) {
    throw ArgumentError('Expected a JSON object, got ${decoded.runtimeType}');
  }
  return decoded;
}

/// Validates that [message] contains all [requiredFields].
///
/// Returns a list of missing field names. Empty list means valid.
List<String> validateMessage(Map<String, dynamic> message, List<String> requiredFields) {
  final missing = <String>[];
  for (final field in requiredFields) {
    if (!message.containsKey(field)) {
      missing.add(field);
    }
  }
  return missing;
}

/// Supported web client actions and their required fields.
const Map<String, List<String>> _actionRequiredFields = {
  'changeHealth': ['action', 'characterId', 'value'],
  'setInitiative': ['action', 'characterId', 'value'],
  'addStatusEffect': ['action', 'characterId', 'effect'],
  'removeStatusEffect': ['action', 'characterId', 'effect'],
  'addXP': ['action', 'characterId', 'value'],
  'pushSubscribe': ['action', 'characterId', 'subscription'],
  'drawModifier': ['action', 'characterId', 'baseAttack'],
  'setElement': ['action', 'element', 'state'],
  'clientError': ['action', 'error'],
  'ping': ['action'],
};

/// Returns the required fields for a given action, or null if unsupported.
List<String>? requiredFieldsForAction(String action) {
  return _actionRequiredFields[action];
}

/// Returns the list of supported action names.
List<String> get supportedActions => _actionRequiredFields.keys.toList();

/// Converts a parsed web message into a human-readable description.
///
/// Returns a descriptive string for logging and state updates.
/// Returns a generic fallback if the action is unrecognized.
String describeAction(Map<String, dynamic> message) {
  final action = message['action'] as String?;
  final characterId = message['characterId'] as String? ?? 'unknown';

  switch (action) {
    case 'changeHealth':
      final value = message['value'];
      return '$characterId: change health by $value';
    case 'setInitiative':
      final value = message['value'];
      return '$characterId: set initiative to $value';
    case 'addStatusEffect':
      final effect = message['effect'];
      return '$characterId: add status effect $effect';
    case 'removeStatusEffect':
      final effect = message['effect'];
      return '$characterId: remove status effect $effect';
    case 'addXP':
      final value = message['value'];
      return '$characterId: add $value XP';
    case 'pushSubscribe':
      return '$characterId: push subscribe';
    case 'drawModifier':
      final baseAttack = message['baseAttack'];
      return '$characterId: draw modifier (base attack $baseAttack)';
    case 'setElement':
      final element = message['element'];
      final state = message['state'];
      final names = ['fire','ice','air','earth','light','dark'];
      final states = ['full','half','inert'];
      final eName = (element is num && element < names.length) ? names[element as int] : element;
      final sName = (state is num && state < states.length) ? states[state as int] : state;
      return 'element: $eName -> $sName';
    case 'clientError':
      final error = message['error'];
      return 'CLIENT ERROR: $error';
    case 'ping':
      return 'ping';
    default:
      return 'Unknown action: $action';
  }
}
