import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/tokens/te_colors.dart';

/// `context.te` gives screens the semantic color tokens.
extension TeContext on BuildContext {
  TeColors get te => Theme.of(this).extension<TeColors>() ?? TeColors.light;
}
