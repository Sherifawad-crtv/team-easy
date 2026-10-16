import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';

/// Shared frame for auth screens: scrollable, centered column on wide
/// screens, gutter padding, optional back button.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({required this.children, this.showBack = true, super.key});

  final List<Widget> children;
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: showBack
          ? AppBar(backgroundColor: Colors.transparent, shape: const Border())
          : null,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                TeSpace.gutter,
                TeSpace.lg,
                TeSpace.gutter,
                TeSpace.xxxl,
              ),
              children: children,
            ),
          ),
        ),
      ),
    );
  }
}
