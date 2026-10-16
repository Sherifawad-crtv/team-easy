import 'package:team_easy/features/auth/domain/auth_entities.dart';

/// Accounts, sessions and organization invites.
///
/// Methods throw `Failure` subclasses (`AuthFailure`, `NetworkFailure`,
/// `UnknownFailure`). Nothing here knows about a backend.
abstract interface class AuthRepository {
  /// Emits the restored session (or null) first, then every change.
  Stream<Account?> watchSession();

  Future<Account> signUp(SignUpData data);

  Future<Account> signIn({required String email, required String password});

  Future<void> signOut();

  Future<void> requestPasswordReset(String email);

  /// Accepts a full invite link or a bare code.
  Future<OrgInvite> resolveInvite(String linkOrCode);

  /// Switch between individual and organization identity (ACC-07).
  Future<Account> switchIdentity(IdentityKind kind);

  Future<void> deleteAccount();
}
