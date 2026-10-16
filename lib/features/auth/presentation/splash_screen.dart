import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/widgets/te_logo.dart';

/// Shown while the saved session is being restored.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: TeLogo(size: 96)));
  }
}
