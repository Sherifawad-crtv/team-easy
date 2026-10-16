/// Lets the user choose a profile photo from the device.
abstract interface class PhotoPickerService {
  /// Returns a local path, or null if the user cancelled.
  Future<String?> pickPhoto();
}
