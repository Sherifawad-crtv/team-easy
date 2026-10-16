import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';

/// Circular avatar. Shows initials, or a person glyph when [hasPhoto] is true
/// (real photos arrive when media is wired).
class TeAvatar extends StatelessWidget {
  const TeAvatar({
    required this.name,
    this.size = TeSize.avatarMd,
    this.hasPhoto = false,
    super.key,
  });

  final String name;
  final double size;
  final bool hasPhoto;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    if (parts.isEmpty) return '?';
    final first = parts.first[0];
    final last = parts.length > 1 ? parts.last[0] : '';
    return (first + last).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final te = context.te;
    return Semantics(
      label: name.isEmpty ? 'Profile photo' : name,
      excludeSemantics: true,
      child: Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: hasPhoto ? te.accentSoft : te.surfaceTinted,
        ),
        child: hasPhoto || name.trim().isEmpty
            ? Icon(
                hasPhoto ? Icons.person : Icons.person_outline,
                size: size * 0.55,
                color: hasPhoto ? te.textPrimary : te.action,
              )
            : Text(
                _initials,
                style: Theme.of(context).textTheme.titleMedium
                    ?.copyWith(color: te.action, fontSize: size * 0.36),
              ),
      ),
    );
  }
}
