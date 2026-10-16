import 'package:team_easy/core/error/failure.dart';
import 'package:team_easy/features/auth/domain/auth_failure.dart';

/// What to tell the user when an auth call fails.
class AuthMessage {
  const AuthMessage(this.title, this.body, {this.isOffline = false});

  final String title;
  final String body;
  final bool isOffline;
}

AuthMessage describeAuthError(Object error) {
  return switch (error) {
    NetworkFailure() => const AuthMessage(
      "You're offline",
      'Check your connection and try again.',
      isOffline: true,
    ),
    InvalidCredentials() => const AuthMessage(
      "That email and password don't match",
      'Check them and try again, or reset your password.',
    ),
    EmailAlreadyUsed() => const AuthMessage(
      'That email already has an account',
      'Sign in instead, or use a different email.',
    ),
    InviteInvalid() => const AuthMessage(
      "This invite isn't valid",
      'Check the link or code, or ask your admin for a new one.',
    ),
    InviteExpired() => const AuthMessage(
      'This invite has expired',
      'Ask your admin to send a new one.',
    ),
    _ => const AuthMessage(
      'Something went wrong on our side',
      'Nothing was changed. Try again in a moment.',
    ),
  };
}
