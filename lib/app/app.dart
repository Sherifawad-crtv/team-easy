import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:team_easy/app/router.dart';
import 'package:team_easy/core/design_system/te_theme.dart';
import 'package:team_easy/core/design_system/widgets/debug_scenario_overlay.dart';

/// App shell: theme, routing and the debug scenario control.
class TeamEasyApp extends ConsumerWidget {
  const TeamEasyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Team Easy',
      debugShowCheckedModeBanner: false,
      theme: TeTheme.light(),
      themeMode: ThemeMode.light,
      routerConfig: ref.watch(routerProvider),
      builder: (context, child) =>
          DebugScenarioOverlay(child: child ?? const SizedBox.shrink()),
    );
  }
}
