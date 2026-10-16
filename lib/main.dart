import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:team_easy/app/app.dart';

void main() {
  runApp(const ProviderScope(retry: _noRetry, child: TeamEasyApp()));
}

/// Failures are shown to the user with a retry button; never retry silently.
Duration? _noRetry(int retryCount, Object error) => null;
