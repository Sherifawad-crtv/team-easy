import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/te_context.dart';

enum TeButtonVariant { primary, secondary, tertiary, destructive }

/// The one button. Shows a spinner and ignores taps while [isLoading].
class TeButton extends StatelessWidget {
  const TeButton({
    required this.label,
    required this.onPressed,
    this.variant = TeButtonVariant.primary,
    this.isLoading = false,
    this.expand = true,
    this.icon,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final TeButtonVariant variant;
  final bool isLoading;
  final bool expand;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final te = context.te;
    final filled =
        variant == TeButtonVariant.primary ||
        variant == TeButtonVariant.destructive;
    final spinnerColor = filled ? te.onAction : te.action;

    final content = isLoading
        ? SizedBox.square(
            dimension: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: spinnerColor,
              semanticsLabel: 'Loading',
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 20),
                const SizedBox(width: 8),
              ],
              Flexible(child: Text(label, textAlign: TextAlign.center)),
            ],
          );

    // Keep the enabled look while loading, but swallow taps.
    final handler = isLoading ? () {} : onPressed;

    final button = switch (variant) {
      TeButtonVariant.primary => FilledButton(
        onPressed: handler,
        child: content,
      ),
      TeButtonVariant.destructive => FilledButton(
        style: FilledButton.styleFrom(backgroundColor: te.error),
        onPressed: handler,
        child: content,
      ),
      TeButtonVariant.secondary => OutlinedButton(
        onPressed: handler,
        child: content,
      ),
      TeButtonVariant.tertiary => TextButton(
        onPressed: handler,
        child: content,
      ),
    };

    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}
