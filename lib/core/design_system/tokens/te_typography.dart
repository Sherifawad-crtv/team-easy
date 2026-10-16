import 'package:flutter/material.dart';

/// Type scale. Poppins throughout (bundled, no network fetch).
abstract final class TeType {
  static const String family = 'Poppins';

  static TextTheme textTheme(Color primary, Color secondary) {
    TextStyle s(double size, double height, FontWeight w, [Color? c]) =>
        TextStyle(
          fontFamily: family,
          fontSize: size,
          height: height / size,
          fontWeight: w,
          color: c ?? primary,
          letterSpacing: 0,
        );
    return TextTheme(
      displayLarge: s(40, 48, FontWeight.w700),
      displayMedium: s(32, 40, FontWeight.w700),
      displaySmall: s(28, 36, FontWeight.w600),
      headlineLarge: s(26, 34, FontWeight.w600),
      headlineMedium: s(22, 30, FontWeight.w600),
      headlineSmall: s(20, 28, FontWeight.w600),
      titleLarge: s(18, 26, FontWeight.w600),
      titleMedium: s(16, 24, FontWeight.w600),
      titleSmall: s(14, 20, FontWeight.w600),
      bodyLarge: s(16, 24, FontWeight.w400),
      bodyMedium: s(14, 20, FontWeight.w400),
      bodySmall: s(12, 16, FontWeight.w400, secondary),
      labelLarge: s(14, 20, FontWeight.w500),
      labelMedium: s(12, 16, FontWeight.w500),
      labelSmall: s(11, 16, FontWeight.w500, secondary),
    );
  }
}
