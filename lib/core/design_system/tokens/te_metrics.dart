import 'package:flutter/material.dart';

/// Spacing scale, 4-pt base.
abstract final class TeSpace {
  static const double xxs = 2;
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
  static const double huge = 48;

  /// Screen edge gutter on phones.
  static const double gutter = 16;
}

/// Corner radii.
abstract final class TeRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 20;
  static const double full = 999;

  static const BorderRadius smAll = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius mdAll = BorderRadius.all(Radius.circular(md));
  static const BorderRadius lgAll = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius fullAll = BorderRadius.all(Radius.circular(full));
}

/// Minimum touch target: 48 dp covers iOS (44) and Android (48).
abstract final class TeSize {
  static const double touchTarget = 48;
  static const double iconSm = 20;
  static const double iconMd = 24;
  static const double avatarSm = 32;
  static const double avatarMd = 44;
  static const double avatarLg = 64;
}

/// Elevation as soft navy shadows, never harsh black.
abstract final class TeElevation {
  static const _ink = Color(0xFF0D142E);

  static const List<BoxShadow> none = [];

  /// Cards and list groups.
  static const List<BoxShadow> low = [
    BoxShadow(color: Color(0x0F0D142E), blurRadius: 8, offset: Offset(0, 2)),
  ];

  /// Sheets and menus.
  static const List<BoxShadow> mid = [
    BoxShadow(color: Color(0x190D142E), blurRadius: 20, offset: Offset(0, 6)),
  ];

  /// Dialogs.
  static const List<BoxShadow> high = [
    BoxShadow(color: Color(0x240D142E), blurRadius: 32, offset: Offset(0, 12)),
  ];

  static const Color shadowColor = _ink;
}

/// Motion durations and curves. Animate only to explain a change.
abstract final class TeMotion {
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration base = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 320);

  static const Curve standard = Curves.easeOutCubic;
  static const Curve emphasized = Curves.easeInOutCubicEmphasized;

  /// Returns [Duration.zero] when the user asked to reduce motion.
  static Duration of(BuildContext context, Duration d) =>
      MediaQuery.disableAnimationsOf(context) ? Duration.zero : d;
}
