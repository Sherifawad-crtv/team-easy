/// Field validation for the auth forms. Rules are assumed (PRD is silent):
/// password at least 8 characters with a letter and a number.
abstract final class AuthValidators {
  static final _email = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  static String? name(String? v) {
    final s = (v ?? '').trim();
    if (s.isEmpty) return 'Enter your name';
    if (s.length < 2) return 'Name needs at least 2 characters';
    return null;
  }

  static String? email(String? v) {
    final s = (v ?? '').trim();
    if (s.isEmpty) return 'Enter your email address';
    if (!_email.hasMatch(s)) return 'Enter a valid email address';
    return null;
  }

  static String? newPassword(String? v) {
    final s = v ?? '';
    if (s.isEmpty) return 'Choose a password';
    if (s.length < 8) return 'Use at least 8 characters';
    if (!RegExp('[A-Za-z]').hasMatch(s) || !RegExp('[0-9]').hasMatch(s)) {
      return 'Include at least one letter and one number';
    }
    return null;
  }

  static String? currentPassword(String? v) =>
      (v ?? '').isEmpty ? 'Enter your password' : null;
}
