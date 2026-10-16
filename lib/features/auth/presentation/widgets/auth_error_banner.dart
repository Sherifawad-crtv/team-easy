import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/widgets/te_banner.dart';
import 'package:team_easy/features/auth/presentation/auth_messages.dart';

/// Shows a failure as an offline or error banner.
class AuthErrorBanner extends StatelessWidget {
  const AuthErrorBanner({required this.error, this.onRetry, super.key});

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final m = describeAuthError(error);
    return TeBanner(
      kind: m.isOffline ? TeBannerKind.offline : TeBannerKind.error,
      title: m.title,
      message: m.body,
      actionLabel: onRetry == null ? null : 'Try again',
      onAction: onRetry,
    );
  }
}
