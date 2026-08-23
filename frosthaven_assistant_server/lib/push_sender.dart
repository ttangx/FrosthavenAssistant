import 'dart:convert';
import 'dart:io';

/// Send a Web Push notification by shelling out to the node web-push CLI.
Future<bool> sendPushNotification(
  Map<String, dynamic> subscription,
  String title,
  String body,
) async {
  final vapidFile = File('/opt/frosthaven/vapid.json');
  if (!vapidFile.existsSync()) {
    print('Push: vapid.json not found');
    return false;
  }

  final vapid = jsonDecode(vapidFile.readAsStringSync()) as Map<String, dynamic>;
  final publicKey = vapid['publicKey'] as String;
  final privateKey = vapid['privateKey'] as String;

  final payload = jsonEncode({'title': title, 'body': body});
  final subscriptionJson = jsonEncode(subscription);

  final script = '''
const wp = require("web-push");
wp.setVapidDetails("mailto:admin@epicbroccoli.com", ${jsonEncode(publicKey)}, ${jsonEncode(privateKey)});
wp.sendNotification($subscriptionJson, ${jsonEncode(payload)})
  .then(() => console.log("Push sent"))
  .catch(e => { console.error("Push failed:", e.statusCode || e.message); process.exit(1); });
''';

  try {
    final result = await Process.run('node', ['-e', script], workingDirectory: '/opt/frosthaven');
    if (result.exitCode != 0) {
      print('Push error: ${result.stderr}');
      return false;
    }
    print('Push: ${result.stdout}'.trim());
    return true;
  } catch (e) {
    print('Push: failed to run node: $e');
    return false;
  }
}
