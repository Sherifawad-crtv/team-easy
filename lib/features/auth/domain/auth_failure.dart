import 'package:team_easy/core/error/failure.dart';

sealed class AuthFailure extends Failure {
  const AuthFailure();
}

final class InvalidCredentials extends AuthFailure {
  const InvalidCredentials();
}

final class EmailAlreadyUsed extends AuthFailure {
  const EmailAlreadyUsed();
}

final class InviteInvalid extends AuthFailure {
  const InviteInvalid();
}

final class InviteExpired extends AuthFailure {
  const InviteExpired();
}
