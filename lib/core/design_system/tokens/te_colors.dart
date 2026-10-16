import 'package:flutter/material.dart';

/// Semantic color tokens. Light theme only.
///
/// Values marked "palette" come straight from the brand palette. Values
/// marked "derived" are tints/shades of palette colors, and "proposed" are
/// outside the palette (status colors); both await designer approval.
@immutable
class TeColors extends ThemeExtension<TeColors> {
  const TeColors({
    required this.brand,
    required this.action,
    required this.onAction,
    required this.accent,
    required this.accentSoft,
    required this.highlight,
    required this.background,
    required this.surface,
    required this.surfaceTinted,
    required this.surfaceSunken,
    required this.textPrimary,
    required this.textSecondary,
    required this.textDisabled,
    required this.textLink,
    required this.border,
    required this.borderStrong,
    required this.success,
    required this.warning,
    required this.error,
    required this.info,
    required this.bubbleSent,
    required this.onBubbleSent,
    required this.bubbleReceived,
    required this.onBubbleReceived,
    required this.presenceOnline,
    required this.presenceAway,
    required this.scrim,
  });

  /// Brand blue for large shapes, logo-adjacent graphics and highlights.
  /// Too light for small text on white (contrast 3.8:1).
  final Color brand; // palette #3E88C8

  /// Interactive color: primary buttons, links, selected states. Passes AA
  /// with white text (6.3:1).
  final Color action; // palette #1F62A3
  final Color onAction;

  final Color accent; // palette #2BACE2
  final Color accentSoft; // palette #51C2E6

  /// Warm callout background (announcements, pinned items).
  final Color highlight; // palette #F6F3DD

  final Color background; // derived: palette blue at 4%
  final Color surface;
  final Color surfaceTinted; // derived: palette blue at 10%
  final Color surfaceSunken; // derived: palette blue at 7%

  final Color textPrimary; // palette #0D142E
  final Color textSecondary; // derived from #0D142E
  final Color textDisabled; // derived
  final Color textLink; // palette #1F62A3

  final Color border; // derived
  final Color borderStrong; // derived

  final Color success; // proposed
  final Color warning; // proposed
  final Color error; // proposed
  final Color info; // palette #2BACE2 darkened for text use

  final Color bubbleSent;
  final Color onBubbleSent;
  final Color bubbleReceived;
  final Color onBubbleReceived;

  final Color presenceOnline;
  final Color presenceAway;

  final Color scrim;

  /// The one and only theme.
  static const light = TeColors(
    brand: Color(0xFF3E88C8),
    action: Color(0xFF1F62A3),
    onAction: Color(0xFFFFFFFF),
    accent: Color(0xFF2BACE2),
    accentSoft: Color(0xFF51C2E6),
    highlight: Color(0xFFF6F3DD),
    background: Color(0xFFF5F8FC),
    surface: Color(0xFFFFFFFF),
    surfaceTinted: Color(0xFFE8F1FA),
    surfaceSunken: Color(0xFFEEF3F9),
    textPrimary: Color(0xFF0D142E),
    textSecondary: Color(0xFF4B5675),
    textDisabled: Color(0xFF98A2B8),
    textLink: Color(0xFF1F62A3),
    border: Color(0xFFDCE5F0),
    borderStrong: Color(0xFFB4C4D8),
    success: Color(0xFF1E8E5A),
    warning: Color(0xFFB7791F),
    error: Color(0xFFC0392B),
    info: Color(0xFF1F7FA8),
    bubbleSent: Color(0xFF1F62A3),
    onBubbleSent: Color(0xFFFFFFFF),
    bubbleReceived: Color(0xFFE8F1FA),
    onBubbleReceived: Color(0xFF0D142E),
    presenceOnline: Color(0xFF1E8E5A),
    presenceAway: Color(0xFFB7791F),
    scrim: Color(0x990D142E),
  );

  @override
  TeColors copyWith({Color? action}) => TeColors(
    brand: brand,
    action: action ?? this.action,
    onAction: onAction,
    accent: accent,
    accentSoft: accentSoft,
    highlight: highlight,
    background: background,
    surface: surface,
    surfaceTinted: surfaceTinted,
    surfaceSunken: surfaceSunken,
    textPrimary: textPrimary,
    textSecondary: textSecondary,
    textDisabled: textDisabled,
    textLink: textLink,
    border: border,
    borderStrong: borderStrong,
    success: success,
    warning: warning,
    error: error,
    info: info,
    bubbleSent: bubbleSent,
    onBubbleSent: onBubbleSent,
    bubbleReceived: bubbleReceived,
    onBubbleReceived: onBubbleReceived,
    presenceOnline: presenceOnline,
    presenceAway: presenceAway,
    scrim: scrim,
  );

  // Single static theme: nothing to interpolate.
  @override
  TeColors lerp(TeColors? other, double t) => this;
}
