import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:team_easy/app/app.dart';
import 'package:team_easy/core/config/app_config.dart';
import 'package:team_easy/core/di/mock_scenario.dart';

void main() {
  testWidgets('shell shows scenario switcher and switches scenario', (
    tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: TeamEasyApp()));
    expect(find.text('Team Easy'), findsOneWidget);
    await tester.tap(find.text('empty'));
    await tester.pump();
    final container = ProviderScope.containerOf(
      tester.element(find.byType(MaterialApp)),
    );
    expect(container.read(mockScenarioProvider), MockScenario.empty);
  });

  test('AppConfig defaults match the PRD', () {
    const c = AppConfig();
    expect(c.maxMembersPerMainGroup, 300);
    expect(c.dailyCallLimit, const Duration(hours: 1));
    expect(c.maxCallParticipants, 5);
  });
}
