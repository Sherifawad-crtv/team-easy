import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';
import 'package:team_easy/core/design_system/widgets/te_avatar.dart';
import 'package:team_easy/core/design_system/widgets/te_banner.dart';
import 'package:team_easy/core/design_system/widgets/te_button.dart';
import 'package:team_easy/core/design_system/widgets/te_text_field.dart';
import 'package:team_easy/core/di/providers.dart';
import 'package:team_easy/features/auth/domain/auth_entities.dart';
import 'package:team_easy/features/auth/domain/auth_failure.dart';
import 'package:team_easy/features/auth/presentation/auth_providers.dart';
import 'package:team_easy/features/auth/presentation/auth_validators.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_error_banner.dart';
import 'package:team_easy/features/auth/presentation/widgets/auth_scaffold.dart';

/// Create an account. Covers all three signup paths (ACC-02..04):
/// plain individual, individual with an optional invite code, or arriving
/// from an invite link ([inviteToken]).
class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({this.inviteToken, super.key});

  final String? inviteToken;

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _jobTitle = TextEditingController();
  final _invite = TextEditingController();

  String? _photoPath;
  var _photoError = false;
  var _pickingPhoto = false;
  var _showInviteField = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _jobTitle.dispose();
    _invite.dispose();
    super.dispose();
  }

  Future<void> _choosePhoto() async {
    if (_photoPath != null) {
      setState(() => _photoPath = null);
      return;
    }
    setState(() {
      _pickingPhoto = true;
      _photoError = false;
    });
    try {
      final path = await ref.read(photoPickerProvider).pickPhoto();
      if (mounted) setState(() => _photoPath = path);
    } on Object {
      if (mounted) setState(() => _photoError = true);
    } finally {
      if (mounted) setState(() => _pickingPhoto = false);
    }
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final typedInvite = _invite.text.trim();
    final token =
        widget.inviteToken ?? (typedInvite.isEmpty ? null : typedInvite);
    final job = _jobTitle.text.trim();
    await ref
        .read(signUpActionProvider.notifier)
        .run(
          () => ref
              .read(authRepositoryProvider)
              .signUp(
                SignUpData(
                  name: _name.text.trim(),
                  email: _email.text.trim(),
                  password: _password.text,
                  jobTitle: job.isEmpty ? null : job,
                  photoPath: _photoPath,
                  inviteToken: token,
                ),
              ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final action = ref.watch(signUpActionProvider);
    final text = Theme.of(context).textTheme;
    final te = context.te;
    final busy = action.isLoading;
    final error = action.error;

    final emailTaken = error is EmailAlreadyUsed;
    final inviteProblem = error is InviteInvalid || error is InviteExpired;
    final inviteSummary = widget.inviteToken == null
        ? null
        : ref.watch(inviteProvider(widget.inviteToken!));

    return AuthScaffold(
      children: [
        Text('Create your account', style: text.headlineLarge),
        const SizedBox(height: TeSpace.xxl),
        if (inviteSummary != null)
          inviteSummary.when(
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const TeBanner(
              kind: TeBannerKind.error,
              title: "This invite isn't valid",
              message:
                  'You can still create an account on your own and ask your '
                  'admin for a new invite.',
            ),
            data: (inv) => Padding(
              padding: const EdgeInsets.only(bottom: TeSpace.lg),
              child: TeBanner(
                kind: TeBannerKind.success,
                title: 'Joining ${inv.organization.name}',
                message: 'Invited by ${inv.invitedBy}',
              ),
            ),
          ),
        if (error != null && !emailTaken && !inviteProblem) ...[
          AuthErrorBanner(error: error, onRetry: busy ? null : _submit),
          const SizedBox(height: TeSpace.lg),
        ],
        Center(
          child: Column(
            children: [
              InkResponse(
                onTap: busy || _pickingPhoto ? null : _choosePhoto,
                radius: TeSize.avatarLg,
                child: Semantics(
                  button: true,
                  label: _photoPath == null
                      ? 'Add a profile photo, optional'
                      : 'Remove profile photo',
                  excludeSemantics: true,
                  child: Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      TeAvatar(
                        name: _name.text,
                        size: TeSize.avatarLg + TeSpace.lg,
                        hasPhoto: _photoPath != null,
                      ),
                      Container(
                        padding: const EdgeInsets.all(TeSpace.xs + 2),
                        decoration: BoxDecoration(
                          color: te.action,
                          shape: BoxShape.circle,
                          border: Border.all(color: te.background, width: 2),
                        ),
                        child: _pickingPhoto
                            ? SizedBox.square(
                                dimension: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: te.onAction,
                                ),
                              )
                            : Icon(
                                _photoPath == null ? Icons.add : Icons.close,
                                size: 16,
                                color: te.onAction,
                              ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: TeSpace.sm),
              Text(
                _photoError
                    ? "Couldn't open your photos. Tap to try again."
                    : _photoPath == null
                    ? 'Add a photo (optional)'
                    : 'Tap to remove',
                style: text.bodySmall?.copyWith(
                  color: _photoError ? te.error : te.textSecondary,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: TeSpace.xxl),
        Form(
          key: _formKey,
          child: AutofillGroup(
            child: Column(
              children: [
                TeTextField(
                  label: 'Full name',
                  controller: _name,
                  validator: AuthValidators.name,
                  textInputAction: TextInputAction.next,
                  textCapitalization: TextCapitalization.words,
                  autofillHints: const [AutofillHints.name],
                  enabled: !busy,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: TeSpace.lg),
                TeTextField(
                  label: 'Email',
                  controller: _email,
                  validator: AuthValidators.email,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.newUsername],
                  errorText: emailTaken
                      ? 'That email already has an account. Sign in instead.'
                      : null,
                  enabled: !busy,
                ),
                const SizedBox(height: TeSpace.lg),
                TeTextField(
                  label: 'Password',
                  controller: _password,
                  validator: AuthValidators.newPassword,
                  isPassword: true,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.newPassword],
                  helperText:
                      'At least 8 characters, with a letter and a number',
                  enabled: !busy,
                ),
                const SizedBox(height: TeSpace.lg),
                TeTextField(
                  label: 'Job title (optional)',
                  controller: _jobTitle,
                  textInputAction:
                      _showInviteField && widget.inviteToken == null
                      ? TextInputAction.next
                      : TextInputAction.done,
                  textCapitalization: TextCapitalization.words,
                  autofillHints: const [AutofillHints.jobTitle],
                  enabled: !busy,
                  onSubmitted: (_) =>
                      widget.inviteToken == null && _showInviteField
                      ? null
                      : _submit(),
                ),
                if (widget.inviteToken == null) ...[
                  const SizedBox(height: TeSpace.sm),
                  if (_showInviteField || inviteProblem) ...[
                    const SizedBox(height: TeSpace.sm),
                    TeTextField(
                      label: 'Organization invite code',
                      controller: _invite,
                      textInputAction: TextInputAction.done,
                      errorText: switch (error) {
                        InviteExpired() =>
                          'That invite has expired. Ask your admin for a '
                              'new one.',
                        InviteInvalid() =>
                          "That invite isn't valid. Check the code.",
                        _ => null,
                      },
                      enabled: !busy,
                      onSubmitted: (_) => _submit(),
                    ),
                  ] else
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TeButton(
                        label: 'I have an organization invite',
                        variant: TeButtonVariant.tertiary,
                        expand: false,
                        onPressed: busy
                            ? null
                            : () => setState(() => _showInviteField = true),
                      ),
                    ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: TeSpace.xxl),
        TeButton(label: 'Create account', isLoading: busy, onPressed: _submit),
        const SizedBox(height: TeSpace.sm),
        TeButton(
          label: 'Already have an account? Sign in',
          variant: TeButtonVariant.tertiary,
          onPressed: () => context.go('/sign-in'),
        ),
      ],
    );
  }
}
