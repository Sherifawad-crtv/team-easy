import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Data scenarios every mock must support (docs/WIRING.md).
enum MockScenario { normal, empty, error, slow, offline }

/// Build-time switch: `--dart-define=USE_MOCKS=false` binds real
/// implementations. Defaults to `true` until engineers wire the backend.
const useMocks = bool.fromEnvironment('USE_MOCKS', defaultValue: true);

/// Runtime scenario picked in the debug panel. Mocks read this provider.
class MockScenarioNotifier extends Notifier<MockScenario> {
  @override
  MockScenario build() => MockScenario.normal;

  // Method form keeps call sites explicit.
  // ignore: use_setters_to_change_properties
  void select(MockScenario scenario) => state = scenario;
}

final NotifierProvider<MockScenarioNotifier, MockScenario>
mockScenarioProvider = NotifierProvider<MockScenarioNotifier, MockScenario>(
  MockScenarioNotifier.new,
);
