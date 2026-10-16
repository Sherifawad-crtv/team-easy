import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/scenario_switcher.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';
import 'package:team_easy/core/di/mock_scenario.dart';

/// Floating debug control (mocks only) to flip the data scenario on any screen.
class DebugScenarioOverlay extends StatefulWidget {
  const DebugScenarioOverlay({required this.child, super.key});

  final Widget child;

  @override
  State<DebugScenarioOverlay> createState() => _DebugScenarioOverlayState();
}

class _DebugScenarioOverlayState extends State<DebugScenarioOverlay> {
  var _open = false;

  @override
  Widget build(BuildContext context) {
    if (!useMocks) return widget.child;
    final te = context.te;
    return Stack(
      children: [
        widget.child,
        Positioned(
          right: TeSpace.sm,
          bottom: TeSpace.sm,
          child: SafeArea(
            child: Material(
              color: te.surface,
              elevation: 3,
              borderRadius: TeRadius.mdAll,
              child: Padding(
                padding: const EdgeInsets.all(TeSpace.xs),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (_open)
                      const SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: ScenarioSwitcher(),
                      ),
                    IconButton(
                      // No tooltip: above the Navigator there is no Overlay.
                      icon: Icon(
                        _open ? Icons.close : Icons.bug_report_outlined,
                      ),
                      onPressed: () => setState(() => _open = !_open),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
