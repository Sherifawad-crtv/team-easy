import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/design_preview_screen.dart';
import 'package:team_easy/core/design_system/te_theme.dart';

/// App shell. Routing arrives with the first feature screens; until then the
/// style guide is the home screen.
class TeamEasyApp extends StatelessWidget {
  const TeamEasyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Team Easy',
      debugShowCheckedModeBanner: false,
      theme: TeTheme.light(),
      themeMode: ThemeMode.light,
      home: const DesignPreviewScreen(),
    );
  }
}
