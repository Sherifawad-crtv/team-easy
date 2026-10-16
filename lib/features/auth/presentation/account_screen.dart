import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';
import 'package:team_easy/core/design_system/widgets/te_avatar.dart';
import 'package:team_easy/core/design_system/widgets/te_banner.dart';
import 'package:team_easy/core/design_system/widgets/te_button.dart';
import 'package:team_easy/core/di/providers.dart';
import 'package:team_easy/features/auth/domain/auth_entities.dart';
import 'package:team_easy/features/auth/presentation/auth_providers.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_error_banner.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_scaffold.dart';

/// Signed-in landing placeholder with identity switching (ACC-07), sign out
/// and account deletion (ACC-08). Chats and groups replace this later.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final account = ref.watch(authSessionProvider).value;
    if (account == null) return const SizedBox.shrink();

    final action = ref.watch(accountActionProvider);
    final text = Theme.of(context).textTheme;
    final te = context.te;
    final org = account.organization;
    final repo = ref.read(authRepositoryProvider);
    final notifier = ref.read(accountActionProvider.notifier);

    return AuthScaffold(
      showBack: false,
      children: [
        Row(
          children: [
            TeAvatar(
              name: account.name,
              size: TeSize.avatarLg,
              hasPhoto: account.photoPath != null,
            ),
            const SizedBox(width: TeSpace.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(account.name, style: text.titleLarge),
                  Text(
                    account.email,
                    style: text.bodyMedium?.copyWith(color: te.textSecondary),
                  ),
                  if (account.jobTitle != null)
                    Padding(
                      padding: const EdgeInsets.only(top: TeSpace.xs),
                      child: Chip(label: Text(account.jobTitle!)),
                    ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: TeSpace.xxl),
        const TeBanner(
          title: "You're in",
          message:
              'Chats, groups and calendar come next. For now you can '
              'manage your account here.',
        ),
        if (action.hasError) ...[
          const SizedBox(height: TeSpace.lg),
          AuthErrorBanner(error: action.error!),
        ],
        if (org != null) ...[
          const SizedBox(height: TeSpace.xxl),
          Text('Using Team Easy as', style: text.titleSmall),
          const SizedBox(height: TeSpace.sm),
          Card(
            child: RadioGroup<IdentityKind>(
              groupValue: account.activeIdentity,
              onChanged: (kind) {
                if (kind == null || action.isLoading) return;
                unawaited(notifier.run(() => repo.switchIdentity(kind)));
              },
              child: Column(
                children: [
                  const RadioListTile<IdentityKind>(
                    value: IdentityKind.individual,
                    title: Text('Myself'),
                    subtitle: Text('Your personal chats and groups'),
                  ),
                  const Divider(),
                  RadioListTile<IdentityKind>(
                    value: IdentityKind.organization,
                    title: Text(org.name),
                    subtitle: const Text('Your work chats and groups'),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: TeSpace.xxxl),
        TeButton(
          label: 'Sign out',
          variant: TeButtonVariant.secondary,
          isLoading: action.isLoading,
          onPressed: () => notifier.run(repo.signOut),
        ),
        const SizedBox(height: TeSpace.sm),
        TeButton(
          label: 'Delete account',
          variant: TeButtonVariant.tertiary,
          onPressed: action.isLoading
              ? null
              : () => _confirmDelete(context, ref),
        ),
      ],
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete your account?'),
        content: const Text(
          'Your profile, chats and files are deleted for good. '
          'This cannot be undone.',
        ),
        actions: [
          TeButton(
            label: 'Keep my account',
            variant: TeButtonVariant.tertiary,
            expand: false,
            onPressed: () => Navigator.of(context).pop(false),
          ),
          TeButton(
            label: 'Delete account',
            variant: TeButtonVariant.destructive,
            expand: false,
            onPressed: () => Navigator.of(context).pop(true),
          ),
        ],
      ),
    );
    if (confirmed ?? false) {
      await ref
          .read(accountActionProvider.notifier)
          .run(ref.read(authRepositoryProvider).deleteAccount);
    }
  }
}
