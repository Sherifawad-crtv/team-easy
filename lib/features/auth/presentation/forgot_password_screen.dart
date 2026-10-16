import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';
import 'package:team_easy/core/design_system/widgets/te_button.dart';
import 'package:team_easy/core/design_system/widgets/te_text_field.dart';
import 'package:team_easy/core/di/providers.dart';
import 'package:team_easy/features/auth/presentation/auth_providers.dart';
import 'package:team_easy/features/auth/presentation/auth_validators.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_error_banner.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_scaffold.dart';

/// Request a password reset email. Assumed, see PRD open question 14.
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  String? _sentTo;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final email = _email.text.trim();
    final ok = await ref
        .read(resetPasswordActionProvider.notifier)
        .run(
          () => ref.read(authRepositoryProvider).requestPasswordReset(email),
        );
    if (ok && mounted) setState(() => _sentTo = email);
  }

  @override
  Widget build(BuildContext context) {
    final action = ref.watch(resetPasswordActionProvider);
    final text = Theme.of(context).textTheme;
    final te = context.te;

    if (_sentTo != null) {
      return AuthScaffold(
        children: [
          Icon(Icons.mark_email_read_outlined, size: 48, color: te.action),
          const SizedBox(height: TeSpace.lg),
          Text('Check your inbox', style: text.headlineLarge),
          const SizedBox(height: TeSpace.md),
          Text(
            'If $_sentTo has an account, a reset link is on its way. '
            'It can take a few minutes.',
            style: text.bodyLarge?.copyWith(color: te.textSecondary),
          ),
          const SizedBox(height: TeSpace.xxxl),
          TeButton(label: 'Back to sign in', onPressed: () => context.pop()),
        ],
      );
    }

    return AuthScaffold(
      children: [
        Text('Reset your password', style: text.headlineLarge),
        const SizedBox(height: TeSpace.md),
        Text(
          "Enter the email you signed up with and we'll send you a reset link.",
          style: text.bodyLarge?.copyWith(color: te.textSecondary),
        ),
        const SizedBox(height: TeSpace.xxl),
        if (action.hasError) ...[
          AuthErrorBanner(
            error: action.error!,
            onRetry: action.isLoading ? null : _submit,
          ),
          const SizedBox(height: TeSpace.lg),
        ],
        Form(
          key: _formKey,
          child: TeTextField(
            label: 'Email',
            controller: _email,
            validator: AuthValidators.email,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.email],
            enabled: !action.isLoading,
            onSubmitted: (_) => _submit(),
          ),
        ),
        const SizedBox(height: TeSpace.xxl),
        TeButton(
          label: 'Send reset link',
          isLoading: action.isLoading,
          onPressed: _submit,
        ),
      ],
    );
  }
}
