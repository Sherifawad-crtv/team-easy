import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';
import 'package:team_easy/core/design_system/widgets/te_button.dart';
import 'package:team_easy/core/design_system/widgets/te_logo.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_scaffold.dart';

/// First screen for signed-out users. The three signup paths start here.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return AuthScaffold(
      showBack: false,
      children: [
        const SizedBox(height: TeSpace.huge),
        const Align(alignment: Alignment.centerLeft, child: TeLogo(size: 72)),
        const SizedBox(height: TeSpace.xxxl),
        Text('Your team, one tap away.', style: text.displayMedium),
        const SizedBox(height: TeSpace.md),
        Text(
          'Chat, call and plan with the people you work with, '
          'whether you are on your own or part of an organization.',
          style: text.bodyLarge?.copyWith(color: context.te.textSecondary),
        ),
        const SizedBox(height: TeSpace.huge),
        TeButton(
          label: 'Create account',
          onPressed: () => context.go('/sign-up'),
        ),
        const SizedBox(height: TeSpace.md),
        TeButton(
          label: 'Sign in',
          variant: TeButtonVariant.secondary,
          onPressed: () => context.go('/sign-in'),
        ),
        const SizedBox(height: TeSpace.sm),
        TeButton(
          label: 'I have an organization invite',
          variant: TeButtonVariant.tertiary,
          onPressed: () => context.go('/invite'),
        ),
      ],
    );
  }
}
