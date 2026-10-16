// WIRE markers must stay on one line each so tool/list_wires.sh can read them.
// ignore_for_file: lines_longer_than_80_chars

import 'dart:async';

import 'package:team_easy/core/di/mock_scenario.dart';
import 'package:team_easy/core/error/failure.dart';
import 'package:team_easy/features/auth/domain/auth_entities.dart';
import 'package:team_easy/features/auth/domain/auth_failure.dart';
import 'package:team_easy/features/auth/domain/auth_repository.dart';

// WIRE: auth.session
// Req: ACC-01..04, ACC-06 | Contract: AuthRepository.signUp/signIn/signOut/watchSession | Mock: MockAuthRepository
// Real: create account (individual, optional org attach via invite), sign in/out with email + password, persist and restore the session, emit it on watchSession, map errors to AuthFailure
// Server must enforce: identity, unique email, password rules, invite validity
//
// WIRE: auth.account-switch
// Req: ACC-07 | Contract: AuthRepository.switchIdentity | Mock: MockAuthRepository
// Real: switch active identity between individual and organization; scope all data by active identity
// Server must enforce: data isolation between identities
//
// WIRE: auth.delete-account
// Req: ACC-08 | Contract: AuthRepository.deleteAccount | Mock: MockAuthRepository
// Real: delete account and associated data per policy, end the session
// Server must enforce: full deletion
//
// WIRE: auth.org-invite
// Req: ACC-03..05 | Contract: AuthRepository.resolveInvite | Mock: MockAuthRepository
// Real: resolve an admin-issued invite link or code to its organization; reject invalid or expired
// Server must enforce: invite validity, expiry, single organization attach
//
// WIRE: auth.password-reset
// Req: ACC-01 (assumed, see PRD open question 14) | Contract: AuthRepository.requestPasswordReset | Mock: MockAuthRepository
// Real: send a reset email; respond the same whether or not the address exists
// Server must enforce: rate limiting, no account enumeration
//
// Demo data: sign in with any email and a password of 8+ characters, except
// "wrongpass1" (rejected) and emails starting with "taken@" (already used on
// sign up). Invites: "ORG-ACME" is valid, "ORG-OLD" is expired, anything else
// is invalid.
class MockAuthRepository implements AuthRepository {
  MockAuthRepository(this._scenario);

  final MockScenario Function() _scenario;
  final _controller = StreamController<Account?>.broadcast();
  Account? _current;

  static const _acme = Organization(id: 'org-acme', name: 'Acme Studio');

  Future<void> _gate() async {
    final scenario = _scenario();
    await Future<void>.delayed(
      Duration(milliseconds: scenario == MockScenario.slow ? 3500 : 600),
    );
    if (scenario == MockScenario.offline) throw const NetworkFailure();
    if (scenario == MockScenario.error) throw const UnknownFailure();
  }

  void _emit(Account? account) {
    _current = account;
    _controller.add(account);
  }

  @override
  Stream<Account?> watchSession() async* {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    yield _current;
    yield* _controller.stream;
  }

  @override
  Future<Account> signUp(SignUpData data) async {
    await _gate();
    if (data.email.toLowerCase().startsWith('taken@')) {
      throw const EmailAlreadyUsed();
    }
    Organization? org;
    if (data.inviteToken != null) {
      org = _resolve(data.inviteToken!).organization;
    }
    final account = Account(
      id: 'user-${data.email.hashCode.abs()}',
      name: data.name,
      email: data.email,
      jobTitle: data.jobTitle,
      photoPath: data.photoPath,
      organization: org,
      activeIdentity: org == null
          ? IdentityKind.individual
          : IdentityKind.organization,
    );
    _emit(account);
    return account;
  }

  @override
  Future<Account> signIn({
    required String email,
    required String password,
  }) async {
    await _gate();
    if (password == 'wrongpass1') throw const InvalidCredentials();
    final account = Account(
      id: 'user-${email.hashCode.abs()}',
      name: 'Layla Haddad',
      email: email,
      jobTitle: 'Product designer',
      organization: _acme,
    );
    _emit(account);
    return account;
  }

  @override
  Future<void> signOut() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    _emit(null);
  }

  @override
  Future<void> requestPasswordReset(String email) => _gate();

  @override
  Future<OrgInvite> resolveInvite(String linkOrCode) async {
    await _gate();
    return _resolve(linkOrCode);
  }

  OrgInvite _resolve(String linkOrCode) {
    final token = linkOrCode.trim().split('/').last.toUpperCase();
    if (token == 'ORG-OLD') throw const InviteExpired();
    if (token != 'ORG-ACME') throw const InviteInvalid();
    return const OrgInvite(
      token: 'ORG-ACME',
      organization: _acme,
      invitedBy: 'Omar Al-Fayed',
    );
  }

  @override
  Future<Account> switchIdentity(IdentityKind kind) async {
    await _gate();
    final updated = _current!.withIdentity(kind);
    _emit(updated);
    return updated;
  }

  @override
  Future<void> deleteAccount() async {
    await _gate();
    _emit(null);
  }
}
