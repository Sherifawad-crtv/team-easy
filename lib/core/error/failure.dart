/// Base type for every expected error that crosses a layer boundary.
///
/// Repositories throw subclasses of this; screens map them to messages.
abstract class Failure implements Exception {
  const Failure();
}

/// No connection, or the server could not be reached.
class NetworkFailure extends Failure {
  const NetworkFailure();
}

/// Anything unexpected from a backend or SDK.
class UnknownFailure extends Failure {
  const UnknownFailure();
}
