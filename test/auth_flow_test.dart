import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:team_easy/app/app.dart';
import 'package:team_easy/core/di/mock_scenario.dart';
import 'package:team_easy/core/error/failure.dart';
import 'package:team_easy/features/auth/data/mock/mock_auth_repository.dart';
import 'package:team_easy/features/auth/domain/auth_entities.dart';
import 'package:team_easy/features/auth/domain/auth_failure.dart';
import 'package:team_easy/features/auth/presentation/auth_validators.dart';

Duration? _noRetry(int count, Object error) => null;

Future<ProviderContainer> _pump(
  WidgetTester tester, {
  MockScenario scenario = MockScenario.normal,
}) async {
  await tester.binding.setSurfaceSize(const Size(420, 1000));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    const ProviderScope(retry: _noRetry, child: TeamEasyApp()),
  );
  final container = ProviderScope.containerOf(
    tester.element(find.byType(MaterialApp)),
  );
  container.read(mockScenarioProvider.notifier).select(scenario);
  // Session restore (400 ms) then redirect to the welcome screen.
  await tester.pump(const Duration(milliseconds: 500));
  await tester.pumpAndSettle();
  return container;
}

void main() {
  group('validators', () {
    test('email', () {
      expect(AuthValidators.email(''), isNotNull);
      expect(AuthValidators.email('nope'), isNotNull);
      expect(AuthValidators.email(' a@b.co '), isNull);
    });
    test('new password needs 8 chars, a letter and a number', () {
      expect(AuthValidators.newPassword('short1'), isNotNull);
      expect(AuthValidators.newPassword('longlonglong'), isNotNull);
      expect(AuthValidators.newPassword('12345678'), isNotNull);
      expect(AuthValidators.newPassword('longpass1'), isNull);
    });
  });

  group('MockAuthRepository', () {
    MockAuthRepository repo([MockScenario s = MockScenario.normal]) =>
        MockAuthRepository(() => s);

    test('rejects wrong credentials', () {
      expect(
        repo().signIn(email: 'a@b.co', password: 'wrongpass1'),
        throwsA(isA<InvalidCredentials>()),
      );
    });

    test('taken email fails sign up', () {
      expect(
        repo().signUp(
          const SignUpData(
            name: 'Sam',
            email: 'taken@x.co',
            password: 'longpass1',
          ),
        ),
        throwsA(isA<EmailAlreadyUsed>()),
      );
    });

    test('sign up with a valid invite attaches the organization', () async {
      final account = await repo().signUp(
        const SignUpData(
          name: 'Sam',
          email: 'sam@x.co',
          password: 'longpass1',
          inviteToken: 'org-acme',
        ),
      );
      expect(account.organization?.name, 'Acme Studio');
      expect(account.activeIdentity, IdentityKind.organization);
    });

    test('invites: expired and invalid', () {
      expect(repo().resolveInvite('ORG-OLD'), throwsA(isA<InviteExpired>()));
      expect(
        repo().resolveInvite('https://x.co/invite/nope'),
        throwsA(isA<InviteInvalid>()),
      );
    });

    test('offline scenario throws NetworkFailure', () {
      expect(
        repo(MockScenario.offline).requestPasswordReset('a@b.co'),
        throwsA(isA<NetworkFailure>()),
      );
    });
  });

  group('screens', () {
    testWidgets('welcome offers the three signup paths', (tester) async {
      await _pump(tester);
      expect(find.text('Create account'), findsOneWidget);
      expect(find.text('Sign in'), findsOneWidget);
      expect(find.text('I have an organization invite'), findsOneWidget);
    });

    testWidgets('sign in shows validation then signs in', (tester) async {
      await _pump(tester);
      await tester.tap(find.text('Sign in'));
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(FilledButton, 'Sign in'));
      await tester.pump();
      expect(find.text('Enter your email address'), findsOneWidget);
      expect(find.text('Enter your password'), findsOneWidget);

      await tester.enterText(find.byType(TextFormField).at(0), 'a@b.co');
      await tester.enterText(find.byType(TextFormField).at(1), 'longpass1');
      await tester.tap(find.widgetWithText(FilledButton, 'Sign in'));
      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.pump(const Duration(seconds: 1));
      await tester.pumpAndSettle();
      expect(find.text('Layla Haddad'), findsOneWidget);
    });

    testWidgets('sign in shows the offline banner with retry', (tester) async {
      await _pump(tester, scenario: MockScenario.offline);
      await tester.tap(find.text('Sign in'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(0), 'a@b.co');
      await tester.enterText(find.byType(TextFormField).at(1), 'longpass1');
      await tester.tap(find.widgetWithText(FilledButton, 'Sign in'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump();
      expect(find.text("You're offline"), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
    });

    testWidgets('invalid invite link shows an error and a way out', (
      tester,
    ) async {
      await _pump(tester);
      await tester.tap(find.text('I have an organization invite'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField), 'WRONG');
      await tester.tap(find.text('Check invite'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.pumpAndSettle();
      expect(find.text("This invite isn't valid"), findsOneWidget);
      expect(find.text('Enter a different code'), findsOneWidget);
    });
  });
}
