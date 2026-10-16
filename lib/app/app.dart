import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:team_easy/core/design_system/scenario_switcher.dart';

/// App shell. Theme and routing are added with the design system step.
class TeamEasyApp extends StatelessWidget {
  const TeamEasyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Team Easy',
      debugShowCheckedModeBanner: false,
      home: _BootstrapScreen(),
    );
  }
}

class _BootstrapScreen extends ConsumerWidget {
  const _BootstrapScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Team Easy'),
                SizedBox(height: 16),
                ScenarioSwitcher(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
