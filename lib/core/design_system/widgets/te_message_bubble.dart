import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';

enum TeBubbleStatus { sending, sent, failed }

/// Text message bubble. Sent bubbles sit right, received left.
class TeMessageBubble extends StatelessWidget {
  const TeMessageBubble({
    required this.text,
    required this.time,
    this.isSent = false,
    this.status = TeBubbleStatus.sent,
    this.senderName,
    super.key,
  });

  final String text;
  final String time;
  final bool isSent;
  final TeBubbleStatus status;

  /// Shown above received messages in group chats.
  final String? senderName;

  @override
  Widget build(BuildContext context) {
    final te = context.te;
    final textTheme = Theme.of(context).textTheme;
    final bg = isSent ? te.bubbleSent : te.bubbleReceived;
    final fg = isSent ? te.onBubbleSent : te.onBubbleReceived;
    final failed = status == TeBubbleStatus.failed;

    final meta = switch (status) {
      TeBubbleStatus.sending => 'Sending…',
      TeBubbleStatus.failed => 'Not sent. Tap to retry',
      TeBubbleStatus.sent => time,
    };

    return Align(
      alignment: isSent ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.78,
        ),
        child: Column(
          crossAxisAlignment: isSent
              ? CrossAxisAlignment.end
              : CrossAxisAlignment.start,
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(TeRadius.lg),
                  topRight: const Radius.circular(TeRadius.lg),
                  bottomLeft: Radius.circular(
                    isSent ? TeRadius.lg : TeSpace.xs,
                  ),
                  bottomRight: Radius.circular(
                    isSent ? TeSpace.xs : TeRadius.lg,
                  ),
                ),
                border: failed ? Border.all(color: te.error) : null,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: TeSpace.lg,
                  vertical: TeSpace.md,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (senderName != null && !isSent)
                      Padding(
                        padding: const EdgeInsets.only(bottom: TeSpace.xs),
                        child: Text(
                          senderName!,
                          style: textTheme.labelMedium?.copyWith(
                            color: te.action,
                          ),
                        ),
                      ),
                    Text(text, style: textTheme.bodyLarge?.copyWith(color: fg)),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: TeSpace.xs),
              child: Text(
                meta,
                style: textTheme.bodySmall?.copyWith(
                  color: failed ? te.error : te.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
