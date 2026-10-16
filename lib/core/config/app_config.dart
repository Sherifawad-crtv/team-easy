/// Business limits and quotas from the PRD (section 16 and Part A).
///
/// Nothing outside this file may hardcode these values. In production they
/// are served from config/DB (wire id `config.limits`); these are the local
/// defaults used by mocks.
class AppConfig {
  const AppConfig({
    this.maxMembersPerMainGroup = 300,
    this.maxGroupsPerLevel = 5,
    this.maxSubGroupsPerGroup = 5,
    this.maxSubSubGroupsPerSubGroup = 5,
    this.dailyCallLimit = const Duration(hours: 1),
    this.maxCallParticipants = 5,
    this.standardAttachmentRetention = const Duration(days: 6),
    this.businessAttachmentRetention = const Duration(days: 15),
    this.archivedChatRetention = const Duration(days: 30),
    this.deleteGroupUndoWindow = const Duration(seconds: 10),
  });

  /// GRP-05: counted across the main group and all of its sub-groups.
  final int maxMembersPerMainGroup;

  /// GRP-02: hierarchy 5 / 5 / 5 (per parent assumed, PRD open question 5).
  final int maxGroupsPerLevel;
  final int maxSubGroupsPerGroup;
  final int maxSubSubGroupsPerSubGroup;

  /// CLL-05: shared across audio and video, per user per day.
  final Duration dailyCallLimit;

  /// CLL-02 / CLL-04.
  final int maxCallParticipants;

  /// DAT-02: unopened attachments.
  final Duration standardAttachmentRetention;
  final Duration businessAttachmentRetention;

  /// DAT-04: placeholder value, PRD says "configurable in the database".
  final Duration archivedChatRetention;

  /// GRP-10: placeholder value, PRD says "configurable in the database".
  final Duration deleteGroupUndoWindow;
}
