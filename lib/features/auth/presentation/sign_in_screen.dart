import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';
import 'package:team_easy/core/design_system/widgets/te_button.dart';
import 'package:team_easy/core/design_system/widgets/te_text_field.dart';
import 'package:team_easy/core/di/providers.dart';
import 'package:team_easy/features/auth/presentation/auth_providers.dart';
import 'package:team_easy/features/auth/presentation/auth_validators.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_error_banner.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_scaffold.dart';

/// Email + password sign in (ACC-01).
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    await ref
        .read(signInActionProvider.notifier)
        .run(
          () => ref
              .read(authRepositoryProvider)
              .signIn(email: _email.text.trim(), password: _password.text),
        );
  }

  @override
  Widget build(BuildContext context) {
    final action = ref.watch(signInActionProvider);
    final text = Theme.of(context).textTheme;
    return AuthScaffold(
      children: [
        Text('Sign in', style: text.headlineLarge),
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
          child: AutofillGroup(
            child: Column(
              children: [
                TeTextField(
                  label: 'Email',
                  controller: _email,
                  validator: AuthValidators.email,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  enabled: !action.isLoading,
                ),
                const SizedBox(height: TeSpace.lg),
                TeTextField(
                  label: 'Password',
                  controller: _password,
                  validator: AuthValidators.currentPassword,
                  isPassword: true,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.password],
                  enabled: !action.isLoading,
                  onSubmitted: (_) => _submit(),
                ),
              ],
            ),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TeButton(
            label: 'Forgot password?',
            variant: TeButtonVariant.tertiary,
            expand: false,
            onPressed: () => context.push('/forgot-password'),
          ),
        ),
        const SizedBox(height: TeSpace.sm),
        TeButton(
          label: 'Sign in',
          isLoading: action.isLoading,
          onPressed: _submit,
        ),
        const SizedBox(height: TeSpace.sm),
        TeButton(
          label: 'New here? Create an account',
          variant: TeButtonVariant.tertiary,
          onPressed: () => context.go('/sign-up'),
        ),
      ],
    );
  }
}
