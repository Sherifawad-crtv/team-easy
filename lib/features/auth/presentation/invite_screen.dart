import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';
import 'package:team_easy/core/design_system/widgets/te_avatar.dart';
import 'package:team_easy/core/design_system/widgets/te_button.dart';
import 'package:team_easy/core/design_system/widgets/te_text_field.dart';
import 'package:team_easy/features/auth/presentation/auth_providers.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_error_banner.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_scaffold.dart';

/// Organization invite (ACC-04, ACC-05). With a [token] it shows what the
/// invite points to. Without one it asks for the link or code.
class InviteScreen extends ConsumerWidget {
  const InviteScreen({this.token, super.key});

  final String? token;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = token;
    if (t == null || t.isEmpty) return const _EnterInvite();

    final text = Theme.of(context).textTheme;
    final te = context.te;
    final invite = ref.watch(inviteProvider(t));

    return AuthScaffold(
      children: [
        invite.when(
          loading: () => Semantics(
            liveRegion: true,
            label: 'Checking your invite',
            child: Padding(
              padding: const EdgeInsets.only(top: TeSpace.huge),
              child: Column(
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: TeSpace.lg),
                  Text('Checking your invite…', style: text.bodyLarge),
                ],
              ),
            ),
          ),
          error: (error, _) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AuthErrorBanner(
                error: error,
                onRetry: () => ref.invalidate(inviteProvider(t)),
              ),
              const SizedBox(height: TeSpace.xxl),
              TeButton(
                label: 'Enter a different code',
                variant: TeButtonVariant.secondary,
                onPressed: () => context.go('/invite'),
              ),
              const SizedBox(height: TeSpace.sm),
              TeButton(
                label: 'Create an account without it',
                variant: TeButtonVariant.tertiary,
                onPressed: () => context.go('/sign-up'),
              ),
            ],
          ),
          data: (inv) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text("You're invited", style: text.headlineLarge),
              const SizedBox(height: TeSpace.xxl),
              DecoratedBox(
                decoration: BoxDecoration(
                  color: te.surface,
                  borderRadius: TeRadius.lgAll,
                  border: Border.all(color: te.border),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(TeSpace.lg),
                  child: Row(
                    children: [
                      TeAvatar(
                        name: inv.organization.name,
                        size: TeSize.avatarLg,
                      ),
                      const SizedBox(width: TeSpace.lg),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(inv.organization.name, style: text.titleLarge),
                            Text(
                              'Invited by ${inv.invitedBy}',
                              style: text.bodyMedium?.copyWith(
                                color: te.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: TeSpace.md),
              Text(
                'You can still use Team Easy on your own. '
                'Your organization account stays separate.',
                style: text.bodyMedium?.copyWith(color: te.textSecondary),
              ),
              const SizedBox(height: TeSpace.xxl),
              TeButton(
                label: 'Continue to create account',
                onPressed: () => context.go(
                  '/sign-up?invite=${Uri.encodeComponent(inv.token)}',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _EnterInvite extends StatefulWidget {
  const _EnterInvite();

  @override
  State<_EnterInvite> createState() => _EnterInviteState();
}

class _EnterInviteState extends State<_EnterInvite> {
  final _formKey = GlobalKey<FormState>();
  final _code = TextEditingController();

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final value = _code.text.trim().split('/').last;
    context.go('/invite/${Uri.encodeComponent(value)}');
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return AuthScaffold(
      children: [
        Text('Join your organization', style: text.headlineLarge),
        const SizedBox(height: TeSpace.md),
        Text(
          'Paste the invite link your admin sent you, or type the code.',
          style: text.bodyLarge?.copyWith(color: context.te.textSecondary),
        ),
        const SizedBox(height: TeSpace.xxl),
        Form(
          key: _formKey,
          child: TeTextField(
            label: 'Invite link or code',
            controller: _code,
            textInputAction: TextInputAction.done,
            validator: (v) => (v ?? '').trim().isEmpty
                ? 'Enter your invite link or code'
                : null,
            onSubmitted: (_) => _submit(),
          ),
        ),
        const SizedBox(height: TeSpace.xxl),
        TeButton(label: 'Check invite', onPressed: _submit),
      ],
    );
  }
}
