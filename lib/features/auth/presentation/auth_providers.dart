// Provider types here are long generics; inference keeps them readable.
// ignore_for_file: specify_nonobvious_property_types

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:team_easy/core/di/providers.dart';
import 'package:team_easy/features/auth/domain/auth_entities.dart';

/// The restored/current session. Null means signed out.
final authSessionProvider = StreamProvider<Account?>(
  (ref) => ref.watch(authRepositoryProvider).watchSession(),
);

/// What an invite link or code points to. Family key is the raw link/code.
final inviteProvider = FutureProvider.autoDispose.family<OrgInvite, String>(
  (ref, linkOrCode) =>
      ref.watch(authRepositoryProvider).resolveInvite(linkOrCode),
);

/// Tracks one submit at a time (idle, loading, error) for a form or action.
class AuthActionNotifier extends Notifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<bool> run(Future<void> Function() action) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(action);
    return !state.hasError;
  }

  void reset() => state = const AsyncData(null);
}

typedef AuthActionProvider =
    NotifierProvider<AuthActionNotifier, AsyncValue<void>>;

AuthActionProvider _action() =>
    NotifierProvider.autoDispose<AuthActionNotifier, AsyncValue<void>>(
      AuthActionNotifier.new,
    );

final signInActionProvider = _action();
final signUpActionProvider = _action();
final resetPasswordActionProvider = _action();
final accountActionProvider = _action();
