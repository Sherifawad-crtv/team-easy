import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';

enum TeBannerKind { error, offline, info, success }

/// Inline message with an optional action (for example "Try again").
class TeBanner extends StatelessWidget {
  const TeBanner({
    required this.message,
    this.kind = TeBannerKind.info,
    this.title,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  final TeBannerKind kind;
  final String? title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final te = context.te;
    final text = Theme.of(context).textTheme;
    final (color, icon) = switch (kind) {
      TeBannerKind.error => (te.error, Icons.error_outline),
      TeBannerKind.offline => (te.warning, Icons.wifi_off_rounded),
      TeBannerKind.info => (te.info, Icons.info_outline),
      TeBannerKind.success => (te.success, Icons.check_circle_outline),
    };

    return Semantics(
      liveRegion: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: TeRadius.mdAll,
          border: Border.all(color: color.withValues(alpha: 0.4)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(TeSpace.md),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: TeSize.iconMd),
              const SizedBox(width: TeSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (title != null) Text(title!, style: text.titleSmall),
                    Text(message, style: text.bodyMedium),
                    if (actionLabel != null)
                      Padding(
                        padding: const EdgeInsets.only(top: TeSpace.xs),
                        child: TextButton(
                          style: TextButton.styleFrom(
                            minimumSize: const Size(0, 40),
                            padding: EdgeInsets.zero,
                            foregroundColor: color,
                          ),
                          onPressed: onAction,
                          child: Text(actionLabel!),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
