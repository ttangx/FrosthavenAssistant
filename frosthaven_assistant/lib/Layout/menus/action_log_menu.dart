import 'dart:math';

import 'package:flutter/material.dart';
import 'package:frosthaven_assistant/Resource/round_summary.dart';
import 'package:frosthaven_assistant/Resource/settings.dart';
import 'package:frosthaven_assistant/Resource/ui_utils.dart';
import 'package:frosthaven_assistant/l10n/app_localizations.dart';

import '../../Resource/state/game_state.dart';
import '../../services/service_locator.dart';
import '../widgets/modal_background.dart';
import 'round_summary_tab.dart';

/// Read-only viewer for recent actions and completed-round net changes.
class ActionLogMenu extends StatelessWidget {
  static const double _kMenuWidth = 360.0;
  static const double _kMenuHeight = 500.0;
  static const int _kMaxEntries = 20;

  const ActionLogMenu({super.key, this.gameState, this.roundSummaries});

  final GameState? gameState;

  /// Optional prebuilt summaries, primarily useful when embedding or testing
  /// the menu. Normal app usage derives these from [gameState] history.
  final List<RoundSummary>? roundSummaries;

  /// Confirms, then rolls the game back by [count] actions. The existing undo
  /// path keeps multiplayer in sync.
  Future<void> _confirmRollback(
    BuildContext context,
    GameState gameState,
    int count,
    String description,
    AppLocalizations l10n,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.actionLogRollbackTitle),
        content: Text(l10n.actionLogRollbackBody(description, count)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(l10n.close),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(l10n.actionLogRollbackConfirm),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    for (int index = 0; index < count; index++) {
      gameState.undo();
    }
    if (context.mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final gs = gameState ?? getIt<GameState>();
    final scale = getModalMenuScale(context);
    final l10n = AppLocalizations.of(context)!;
    final availableHeight = MediaQuery.sizeOf(context).height - 32;
    final height = min(_kMenuHeight * scale, availableHeight);

    return ModalBackground(
      width: _kMenuWidth * scale,
      height: height,
      child: ValueListenableBuilder<int>(
        valueListenable: gs.commandIndex,
        builder: (context, index, child) {
          final summaries = roundSummaries ?? buildRoundSummaries(gs);
          return DefaultTabController(
            length: 2,
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                14 * scale,
                10 * scale,
                14 * scale,
                8 * scale,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TabBar(
                    labelStyle: getSmallTextStyle(
                      scale,
                    ).copyWith(fontWeight: FontWeight.bold),
                    unselectedLabelStyle: getSmallTextStyle(scale),
                    indicatorColor: _accentColor,
                    tabs: [
                      Tab(text: l10n.actionLogActionsTab),
                      Tab(text: l10n.actionLogRoundSummaryTab),
                    ],
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        _ActionsTab(
                          gameState: gs,
                          commandIndex: index,
                          scale: scale,
                          onRollback: (count, description) => _confirmRollback(
                            context,
                            gs,
                            count,
                            description,
                            l10n,
                          ),
                        ),
                        RoundSummaryTab(summaries: summaries, scale: scale),
                      ],
                    ),
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: Text(l10n.close, style: getButtonTextStyle(scale)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

bool get _isDarkMode => getIt<Settings>().darkMode.value;

Color get _accentColor =>
    _isDarkMode ? Colors.lightBlueAccent : Colors.lightBlue.shade800;

Color get _mutedColor => _isDarkMode ? Colors.white60 : Colors.black54;

class _ActionsTab extends StatelessWidget {
  const _ActionsTab({
    required this.gameState,
    required this.commandIndex,
    required this.scale,
    required this.onRollback,
  });

  final GameState gameState;
  final int commandIndex;
  final double scale;
  final void Function(int count, String description) onRollback;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final descriptions = gameState.commandDescriptions;
    final appliedCount = min(commandIndex + 1, descriptions.length);
    final start = max(0, appliedCount - ActionLogMenu._kMaxEntries);
    final entries = <Widget>[];

    for (int index = appliedCount - 1; index >= start; index--) {
      final isCurrent = index == appliedCount - 1;
      final count = commandIndex - index;
      entries.add(
        InkWell(
          onTap: count <= 0
              ? null
              : () => onRollback(count, descriptions[index]),
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 4 * scale),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 28 * scale,
                  child: Text(
                    '${index + 1}.',
                    style: getSmallTextStyle(
                      scale,
                    ).copyWith(color: _mutedColor),
                  ),
                ),
                Expanded(
                  child: Text(
                    descriptions[index],
                    style: getSmallTextStyle(scale).copyWith(
                      fontWeight: isCurrent
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (entries.isNotEmpty)
          Padding(
            padding: EdgeInsets.symmetric(vertical: 8 * scale),
            child: Text(
              l10n.actionLogRollbackHint,
              style: getSmallTextStyle(scale).copyWith(color: _mutedColor),
              textAlign: TextAlign.center,
            ),
          ),
        Expanded(
          child: entries.isEmpty
              ? Center(
                  child: Text(
                    l10n.actionLogEmpty,
                    style: getSmallTextStyle(scale),
                  ),
                )
              : ListView(children: entries),
        ),
      ],
    );
  }
}
