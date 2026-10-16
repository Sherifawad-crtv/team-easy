/// Which identity the user is acting as (ACC-07).
enum IdentityKind { individual, organization }

final class Organization {
  const Organization({required this.id, required this.name});

  final String id;
  final String name;
}

/// The signed-in person and the identity they are currently using.
final class Account {
  const Account({
    required this.id,
    required this.name,
    required this.email,
    this.jobTitle,
    this.photoPath,
    this.organization,
    this.activeIdentity = IdentityKind.individual,
  });

  final String id;
  final String name;
  final String email;
  final String? jobTitle;
  final String? photoPath;

  /// Set when the user belongs to an organization (ACC-03, ACC-04).
  final Organization? organization;
  final IdentityKind activeIdentity;

  Account withIdentity(IdentityKind kind) => Account(
    id: id,
    name: name,
    email: email,
    jobTitle: jobTitle,
    photoPath: photoPath,
    organization: organization,
    activeIdentity: kind,
  );
}

/// What an organization invite link resolves to (ACC-04, ACC-05).
final class OrgInvite {
  const OrgInvite({
    required this.token,
    required this.organization,
    required this.invitedBy,
  });

  final String token;
  final Organization organization;
  final String invitedBy;
}

/// Input for creating an account (ACC-01..04).
final class SignUpData {
  const SignUpData({
    required this.name,
    required this.email,
    required this.password,
    this.jobTitle,
    this.photoPath,
    this.inviteToken,
  });

  final String name;
  final String email;
  final String password;
  final String? jobTitle;
  final String? photoPath;

  /// Present when the user signs up through an invite or enters a code.
  final String? inviteToken;
}
