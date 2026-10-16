import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:team_easy/core/config/app_config.dart';
import 'package:team_easy/core/di/mock_scenario.dart';
import 'package:team_easy/features/auth/data/mock/mock_auth_repository.dart';
import 'package:team_easy/features/auth/domain/auth_repository.dart';
import 'package:team_easy/features/profile/data/mock/mock_photo_picker_service.dart';
import 'package:team_easy/features/profile/domain/photo_picker_service.dart';

/// Active business limits. Wire id `config.limits` replaces the source.
final appConfigProvider = Provider<AppConfig>((ref) => const AppConfig());

/// Reads the current mock scenario lazily, so mocks react to the debug switch.
MockScenario Function() _scenarioReader(Ref ref) =>
    () => ref.read(mockScenarioProvider);

// WIRE: auth.session
// Binding: AuthRepository -> MockAuthRepository while USE_MOCKS=true.
// Real: bind the data/remote implementation when USE_MOCKS=false.
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  if (useMocks) return MockAuthRepository(_scenarioReader(ref));
  throw UnimplementedError('Wire auth.session');
});

// WIRE: device.photo-picker
// Binding: PhotoPickerService -> MockPhotoPickerService while USE_MOCKS=true.
final photoPickerProvider = Provider<PhotoPickerService>((ref) {
  if (useMocks) return MockPhotoPickerService(_scenarioReader(ref));
  throw UnimplementedError('Wire device.photo-picker');
});
