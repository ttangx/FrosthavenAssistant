import 'package:flutter/material.dart';
import 'package:frosthaven_assistant/Resource/enums.dart';
import 'package:frosthaven_assistant/Resource/round_summary.dart';
import 'package:frosthaven_assistant/Resource/settings.dart';
import 'package:frosthaven_assistant/Resource/ui_utils.dart';
import 'package:frosthaven_assistant/l10n/app_localizations.dart';

import '../../services/service_locator.dart';

class RoundSummaryTab extends StatelessWidget {
  const RoundSummaryTab({
    super.key,
    required this.summaries,
    required this.scale,
  });

  final List<RoundSummary> summaries;
  final double scale;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (summaries.isEmpty) {
      return Center(
        child: Text(
          l10n.actionLogRoundSummaryEmpty,
          style: getSmallTextStyle(scale),
          textAlign: TextAlign.center,
        ),
      );
    }

    return ListView.separated(
      padding: EdgeInsets.symmetric(vertical: 10 * scale),
      itemCount: summaries.length,
      separatorBuilder: (context, index) => SizedBox(height: 8 * scale),
      itemBuilder: (context, index) =>
          _RoundCard(summary: summaries[index], scale: scale),
    );
  }
}

class _RoundCard extends StatelessWidget {
  const _RoundCard({required this.summary, required this.scale});

  final RoundSummary summary;
  final double scale;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: _accentColor.withValues(alpha: 0.10),
        border: Border.all(color: _accentColor.withValues(alpha: 0.42)),
        borderRadius: BorderRadius.circular(6 * scale),
      ),
      child: Padding(
        padding: EdgeInsets.all(10 * scale),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.actionLogRoundLabel(summary.round),
              style: getTitleTextStyle(
                scale,
              ).copyWith(color: _accentColor, fontSize: 18 * scale),
            ),
            SizedBox(height: 5 * scale),
            if (summary.changes.isEmpty)
              Text(
                l10n.actionLogRoundNoChanges,
                style: getSmallTextStyle(
                  scale,
                ).copyWith(color: _mutedColor, fontStyle: FontStyle.italic),
              )
            else
              for (final change in summary.changes)
                _FigureChangeRow(change: change, scale: scale),
          ],
        ),
      ),
    );
  }
}

class _FigureChangeRow extends StatelessWidget {
  const _FigureChangeRow({required this.change, required this.scale});

  final FigureRoundChange change;
  final double scale;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: 5 * scale),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            change.displayName,
            style: getSmallTextStyle(
              scale,
            ).copyWith(fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 3 * scale),
          Wrap(
            spacing: 5 * scale,
            runSpacing: 4 * scale,
            children: _chips(context),
          ),
        ],
      ),
    );
  }

  List<Widget> _chips(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (change.kind == FigureChangeKind.added) {
      return [
        _DeltaChip(
          label: l10n.actionLogFigureAdded,
          color: _positiveColor,
          scale: scale,
        ),
      ];
    }
    if (change.kind == FigureChangeKind.removed) {
      return [
        _DeltaChip(
          label: l10n.actionLogFigureRemoved,
          color: _negativeColor,
          scale: scale,
        ),
      ];
    }

    return [
      if (change.healthDelta != null)
        _DeltaChip(
          label: '${_signed(change.healthDelta!)} HP',
          color: change.healthDelta! > 0 ? _positiveColor : _negativeColor,
          scale: scale,
        ),
      if (change.xpDelta != null)
        _DeltaChip(
          label: '${_signed(change.xpDelta!)} XP',
          color: _xpColor,
          scale: scale,
        ),
      for (final label in _conditionLabels(change.conditionsAdded, '+'))
        _DeltaChip(label: label, color: _accentColor, scale: scale),
      for (final label in _conditionLabels(change.conditionsRemoved, '-'))
        _DeltaChip(label: label, color: _mutedColor, scale: scale),
    ];
  }

  static String _signed(int value) => value > 0 ? '+$value' : '$value';

  static List<String> _conditionLabels(
    List<Condition> conditions,
    String prefix,
  ) {
    final counts = <String, int>{};
    for (final condition in conditions) {
      final name = _capitalized(condition.getName());
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return counts.entries
        .map(
          (entry) =>
              '$prefix${entry.key}${entry.value > 1 ? ' x${entry.value}' : ''}',
        )
        .toList(growable: false);
  }

  static String _capitalized(String value) {
    if (value.isEmpty) return value;
    return '${value[0].toUpperCase()}${value.substring(1)}';
  }
}

class _DeltaChip extends StatelessWidget {
  const _DeltaChip({
    required this.label,
    required this.color,
    required this.scale,
  });

  final String label;
  final Color color;
  final double scale;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        border: Border.all(color: color.withValues(alpha: 0.65)),
        borderRadius: BorderRadius.circular(12 * scale),
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: 7 * scale,
          vertical: 2 * scale,
        ),
        child: Text(
          label,
          style: getSmallTextStyle(
            scale,
          ).copyWith(color: color, fontSize: 13 * scale),
        ),
      ),
    );
  }
}

bool get _isDarkMode => getIt<Settings>().darkMode.value;

Color get _accentColor =>
    _isDarkMode ? Colors.lightBlueAccent : Colors.lightBlue.shade800;

Color get _mutedColor => _isDarkMode ? Colors.white60 : Colors.black54;

Color get _positiveColor =>
    _isDarkMode ? Colors.greenAccent.shade400 : Colors.green.shade800;

Color get _negativeColor =>
    _isDarkMode ? Colors.redAccent.shade100 : Colors.red.shade800;

Color get _xpColor => _isDarkMode ? Colors.amberAccent : Colors.orange.shade900;
