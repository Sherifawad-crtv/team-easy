import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/tokens/te_colors.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';
import 'package:team_easy/core/design_system/tokens/te_typography.dart';

/// Builds the single (light) Material 3 theme from the tokens.
abstract final class TeTheme {
  static ThemeData light() {
    const c = TeColors.light;
    final text = TeType.textTheme(c.textPrimary, c.textSecondary);

    final scheme = ColorScheme.fromSeed(seedColor: c.brand).copyWith(
      primary: c.action,
      onPrimary: c.onAction,
      primaryContainer: c.surfaceTinted,
      onPrimaryContainer: c.action,
      secondary: c.brand,
      onSecondary: Colors.white,
      secondaryContainer: c.surfaceTinted,
      onSecondaryContainer: c.textPrimary,
      tertiary: c.accent,
      surface: c.surface,
      onSurface: c.textPrimary,
      onSurfaceVariant: c.textSecondary,
      surfaceContainerLowest: c.surface,
      surfaceContainerLow: c.background,
      surfaceContainer: c.surfaceSunken,
      surfaceContainerHigh: c.surfaceTinted,
      surfaceContainerHighest: c.surfaceTinted,
      outline: c.borderStrong,
      outlineVariant: c.border,
      error: c.error,
      onError: Colors.white,
      scrim: c.scrim,
      shadow: TeElevation.shadowColor,
      surfaceTint: Colors.transparent,
    );

    const buttonShape = RoundedRectangleBorder(borderRadius: TeRadius.mdAll);
    const buttonSize = Size(64, TeSize.touchTarget);
    final buttonText = text.labelLarge?.copyWith(fontWeight: FontWeight.w600);

    OutlineInputBorder border(Color color, [double width = 1]) =>
        OutlineInputBorder(
          borderRadius: TeRadius.mdAll,
          borderSide: BorderSide(color: color, width: width),
        );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: c.background,
      fontFamily: TeType.family,
      textTheme: text,
      extensions: const [c],
      splashFactory: InkSparkle.splashFactory,
      iconTheme: IconThemeData(color: c.textSecondary),
      badgeTheme: BadgeThemeData(
        backgroundColor: c.action,
        textColor: c.onAction,
        textStyle: text.labelSmall?.copyWith(color: c.onAction),
      ),
      dividerTheme: DividerThemeData(color: c.border, space: 1, thickness: 1),
      appBarTheme: AppBarTheme(
        backgroundColor: c.surface,
        foregroundColor: c.textPrimary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleSpacing: TeSpace.xs,
        titleTextStyle: text.titleLarge,
        shape: Border(bottom: BorderSide(color: c.border)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: buttonSize,
          shape: buttonShape,
          textStyle: buttonText,
          backgroundColor: c.action,
          foregroundColor: c.onAction,
          disabledBackgroundColor: c.surfaceSunken,
          disabledForegroundColor: c.textDisabled,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: buttonSize,
          shape: buttonShape,
          textStyle: buttonText,
          foregroundColor: c.action,
          side: BorderSide(color: c.borderStrong),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          minimumSize: buttonSize,
          shape: buttonShape,
          textStyle: buttonText,
          foregroundColor: c.action,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: TeSpace.lg,
          vertical: TeSpace.md,
        ),
        hintStyle: text.bodyLarge?.copyWith(color: c.textDisabled),
        labelStyle: text.bodyMedium?.copyWith(color: c.textSecondary),
        helperStyle: text.bodySmall,
        errorStyle: text.bodySmall?.copyWith(color: c.error),
        border: border(c.borderStrong),
        enabledBorder: border(c.borderStrong),
        focusedBorder: border(c.action, 2),
        errorBorder: border(c.error),
        focusedErrorBorder: border(c.error, 2),
        disabledBorder: border(c.border),
      ),
      cardTheme: CardThemeData(
        color: c.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: TeRadius.lgAll,
          side: BorderSide(color: c.border),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: c.surfaceSunken,
        selectedColor: c.surfaceTinted,
        side: BorderSide.none,
        shape: const StadiumBorder(),
        labelStyle: text.labelMedium?.copyWith(color: c.textPrimary),
        padding: const EdgeInsets.symmetric(horizontal: TeSpace.xs),
      ),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: TeSpace.lg),
        minVerticalPadding: TeSpace.sm,
        iconColor: c.textSecondary,
        titleTextStyle: text.titleMedium,
        subtitleTextStyle: text.bodyMedium?.copyWith(color: c.textSecondary),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: c.surfaceTinted,
        height: 64,
        labelTextStyle: WidgetStatePropertyAll(text.labelMedium),
        iconTheme: WidgetStateProperty.resolveWith(
          (s) => IconThemeData(
            color: s.contains(WidgetState.selected)
                ? c.action
                : c.textSecondary,
          ),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(borderRadius: TeRadius.lgAll),
        titleTextStyle: text.titleLarge,
        contentTextStyle: text.bodyMedium,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(TeRadius.lg),
          ),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: c.textPrimary,
        contentTextStyle: text.bodyMedium?.copyWith(color: Colors.white),
        actionTextColor: c.accentSoft,
        shape: const RoundedRectangleBorder(borderRadius: TeRadius.mdAll),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: c.action),
    );
  }
}
