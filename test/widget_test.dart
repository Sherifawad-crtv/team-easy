import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:team_easy/app/app.dart';
import 'package:team_easy/core/config/app_config.dart';
import 'package:team_easy/core/design_system/tokens/te_colors.dart';
import 'package:team_easy/core/di/mock_scenario.dart';

double _contrast(Color a, Color b) {
  final la = a.computeLuminance();
  final lb = b.computeLuminance();
  final hi = la > lb ? la : lb;
  final lo = la > lb ? lb : la;
  return (hi + 0.05) / (lo + 0.05);
}

Duration? _noRetry(int count, Object error) => null;

void main() {
  testWidgets('debug overlay switches the mock scenario', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(retry: _noRetry, child: TeamEasyApp()),
    );
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.bug_report_outlined));
    await tester.pumpAndSettle();
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

  test('text and action colors meet WCAG AA (4.5:1)', () {
    const c = TeColors.light;
    expect(_contrast(c.textPrimary, c.background), greaterThanOrEqualTo(4.5));
    expect(_contrast(c.textSecondary, c.surface), greaterThanOrEqualTo(4.5));
    expect(_contrast(c.textSecondary, c.background), greaterThanOrEqualTo(4.5));
    expect(_contrast(c.onAction, c.action), greaterThanOrEqualTo(4.5));
    expect(_contrast(c.onBubbleSent, c.bubbleSent), greaterThanOrEqualTo(4.5));
    expect(
      _contrast(c.onBubbleReceived, c.bubbleReceived),
      greaterThanOrEqualTo(4.5),
    );
    expect(_contrast(c.error, c.surface), greaterThanOrEqualTo(4.5));
  });
}
