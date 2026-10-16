// WIRE markers must stay on one line each so tool/list_wires.sh can read them.
// ignore_for_file: lines_longer_than_80_chars

import 'package:team_easy/core/di/mock_scenario.dart';
import 'package:team_easy/core/error/failure.dart';
import 'package:team_easy/features/profile/domain/photo_picker_service.dart';

// WIRE: device.photo-picker
// Req: ACC-01, PRF-01 | Contract: PhotoPickerService.pickPhoto | Mock: MockPhotoPickerService
// Real: open the OS photo picker with permission handling, return a local file path or null on cancel
// Server must enforce: n/a (client only; upload limits belong to media.upload)
class MockPhotoPickerService implements PhotoPickerService {
  MockPhotoPickerService(this._scenario);

  final MockScenario Function() _scenario;

  @override
  Future<String?> pickPhoto() async {
    await Future<void>.delayed(const Duration(milliseconds: 350));
    if (_scenario() == MockScenario.error) throw const UnknownFailure();
    return 'mock://photo/1';
  }
}
