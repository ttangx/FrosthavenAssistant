import 'dart:io';

import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_web_socket/shelf_web_socket.dart';

import 'package:frosthaven_assistant_server/standalone_server.dart';
import 'package:frosthaven_assistant_server/websocket_handler.dart';

void main() async {
  StandaloneServer server = StandaloneServer();
  final wsHandler = WebSocketHandler();

  // Provide the WebSocket handler with a way to get current game state.
  wsHandler.getCurrentState = () => server.currentStateMessage('');

  // Start the HTTP/WebSocket server on port 4568 for web browser clients.
  late final HttpServer httpServer;
  try {
    httpServer = await _startWebSocketServer(wsHandler, 4568);
  } catch (e) {
    print('Failed to start WebSocket server on port 4568: $e');
    exit(1);
  }

  ProcessSignal.sigint.watch().listen((signal) async {
    print('Received SIGINT signal, shutting down gracefully...');
    wsHandler.closeAllConnections();
    await httpServer.close();
    server.stopServer("Shutdown Requested");
    exit(0);
  });
  if (!Platform.isWindows) {
    ProcessSignal.sigterm.watch().listen((signal) async {
      print('Received SIGTERM signal, shutting down gracefully...');
      wsHandler.closeAllConnections();
      await httpServer.close();
      server.stopServer("Shutdown Requested");
      exit(0);
    });
  }

  print("Starting Server");
  // TCP server on port 4567 for Flutter app clients (existing protocol).
  await server.startServerInternal("0.0.0.0", 4567);
}

/// Starts an HTTP server with a WebSocket endpoint at /ws.
Future<HttpServer> _startWebSocketServer(
    WebSocketHandler wsHandler, int port) async {
  final wsEndpoint = webSocketHandler((channel) {
    wsHandler.handleConnection(channel);
  });

  final handler = const shelf.Pipeline()
      .addHandler((shelf.Request request) {
    if (request.url.path == 'ws') {
      return wsEndpoint(request);
    }
    return shelf.Response.notFound('Not found');
  });

  final httpServer = await shelf_io.serve(handler, '0.0.0.0', port);
  print('WebSocket server listening on port ${httpServer.port}');
  return httpServer;
}
