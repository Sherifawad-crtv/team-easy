import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:team_easy/core/di/mock_scenario.dart';

/// Debug-only control that flips mock data between scenarios at runtime.
class ScenarioSwitcher extends ConsumerWidget {
  const ScenarioSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!useMocks) return const SizedBox.shrink();
    final current = ref.watch(mockScenarioProvider);
    return SegmentedButton<MockScenario>(
      segments: [
        for (final s in MockScenario.values)
          ButtonSegment(value: s, label: Text(s.name)),
      ],
      selected: {current},
      onSelectionChanged: (v) =>
          ref.read(mockScenarioProvider.notifier).select(v.first),
    );
  }
}
