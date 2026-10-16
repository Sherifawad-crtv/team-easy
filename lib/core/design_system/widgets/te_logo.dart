import 'package:flutter/material.dart';

/// The T mark. Decorative by default; pass [semanticLabel] when it stands
/// alone.
class TeLogo extends StatelessWidget {
  const TeLogo({super.key, this.size = 64, this.semanticLabel});

  final double size;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/brand/t_logo.png',
      width: size,
      height: size,
      semanticLabel: semanticLabel,
      excludeFromSemantics: semanticLabel == null,
    );
  }
}
