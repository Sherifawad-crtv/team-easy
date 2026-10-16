import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:team_easy/core/config/app_config.dart';

/// Active business limits. Wire id `config.limits` replaces the source.
final appConfigProvider = Provider<AppConfig>((ref) => const AppConfig());
