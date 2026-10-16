import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:team_easy/core/design_system/design_preview_screen.dart';
import 'package:team_easy/core/di/mock_scenario.dart';
import 'package:team_easy/features/auth/presentation/account_screen.dart';
import 'package:team_easy/features/auth/presentation/auth_providers.dart';
import 'package:team_easy/features/auth/presentation/forgot_password_screen.dart';
import 'package:team_easy/features/auth/presentation/invite_screen.dart';
import 'package:team_easy/features/auth/presentation/sign_in_screen.dart';
import 'package:team_easy/features/auth/presentation/sign_up_screen.dart';
import 'package:team_easy/features/auth/presentation/splash_screen.dart';
import 'package:team_easy/features/auth/presentation/welcome_screen.dart';

const _signedOutPaths = {
  '/welcome',
  '/sign-in',
  '/forgot-password',
  '/sign-up',
};

bool _isInvite(String path) => path == '/invite' || path.startsWith('/invite/');

/// App routes. Signed-out users see the auth flow, signed-in users see /home.
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref
    ..onDispose(refresh.dispose)
    ..listen(authSessionProvider, (_, _) => refresh.value++);

  return GoRouter(
    refreshListenable: refresh,
    initialLocation: '/',
    redirect: (context, state) {
      final path = state.uri.path;
      final session = ref.read(authSessionProvider);

      // Restoring the saved session. Invite links can be shown meanwhile.
      if (!session.hasValue) {
        return path == '/' || _isInvite(path) ? null : '/';
      }

      final signedIn = session.value != null;
      if (!signedIn) {
        if (path == '/') return '/welcome';
        if (path == '/design' && useMocks) return null;
        return _signedOutPaths.contains(path) || _isInvite(path)
            ? null
            : '/welcome';
      }
      if (path == '/design' && useMocks) return null;
      return path == '/home' ? null : '/home';
    },
    routes: [
      GoRoute(path: '/', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/welcome', builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: '/sign-in', builder: (_, _) => const SignInScreen()),
      GoRoute(
        path: '/forgot-password',
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/sign-up',
        builder: (_, state) =>
            SignUpScreen(inviteToken: state.uri.queryParameters['invite']),
      ),
      GoRoute(path: '/invite', builder: (_, _) => const InviteScreen()),
      GoRoute(
        path: '/invite/:token',
        builder: (_, state) =>
            InviteScreen(token: state.pathParameters['token']),
      ),
      GoRoute(path: '/home', builder: (_, _) => const AccountScreen()),
      GoRoute(path: '/design', builder: (_, _) => const DesignPreviewScreen()),
    ],
  );
});
