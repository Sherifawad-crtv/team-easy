// The app's icons. Every one is a Solar icon (480 Design, CC BY 4.0, via
// @solar-icons/react), Linear style. Screens import the Icon* names below, so
// swapping a glyph happens here and nowhere else.

import {
  AddIcon,
  AltArrowDownIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  ArchiveMinimalisticIcon,
  ArrowUpIcon,
  BellIcon,
  BugIcon,
  CalendarIcon,
  CameraIcon,
  Chart2Icon,
  ChatRoundLineIcon,
  CheckCircleIcon,
  CheckIcon,
  CheckReadIcon,
  ClockCircleIcon,
  CallDroppedRoundedIcon,
  CloseIcon,
  CloudUploadIcon,
  CopyIcon,
  DangerCircleIcon,
  DocumentTextIcon,
  DownloadMinimalisticIcon,
  EyeClosedIcon,
  EyeIcon,
  EndCallRoundedIcon,
  ForbiddenCircleIcon,
  IncomingCallRoundedIcon,
  InfoCircleIcon,
  LinkRoundIcon,
  LogoutIcon,
  MagnifierIcon,
  MenuDotsVerticalIcon,
  MicrophoneIcon,
  OutgoingCallRoundedIcon,
  PhoneCallingRoundedIcon,
  PaperclipIcon,
  PenNewSquareIcon,
  RestartIcon,
  SmartphoneIcon,
  TagIcon,
  TrashBinMinimalisticIcon,
  UserRoundedIcon,
  UsersGroupRoundedIcon,
  VideocameraIcon,
  VideocameraOffIcon,
  VolumeLoudIcon,
  WiFiNoneIcon,
} from '@solar-icons/react/linear'
import type { ComponentType } from 'react'

type P = { size?: number }
type Glyph = ComponentType<{ size?: number | string }>

const make = (Glyph: Glyph) => ({ size = 24 }: P) => <Glyph size={size} />

export const IconChat = make(ChatRoundLineIcon)
export const IconUser = make(UserRoundedIcon)
export const IconEdit = make(PenNewSquareIcon)
export const IconCheck = make(CheckIcon)
export const IconTick = make(CheckIcon)
export const IconDoubleTick = make(CheckReadIcon)
export const IconClock = make(ClockCircleIcon)
export const IconDocument = make(DocumentTextIcon)
export const IconDownload = make(DownloadMinimalisticIcon)
export const IconAttach = make(PaperclipIcon)
export const IconPlus = make(AddIcon)
export const IconSearch = make(MagnifierIcon)
export const IconBack = make(AltArrowLeftIcon)
export const IconClose = make(CloseIcon)
export const IconEye = make(EyeIcon)
export const IconEyeOff = make(EyeClosedIcon)
export const IconSend = make(ArrowUpIcon)
export const IconInfo = make(InfoCircleIcon)
export const IconAlert = make(DangerCircleIcon)
export const IconCheckCircle = make(CheckCircleIcon)
export const IconWifiOff = make(WiFiNoneIcon)
export const IconTrash = make(TrashBinMinimalisticIcon)
export const IconRetry = make(RestartIcon)
export const IconCamera = make(CameraIcon)
export const IconBug = make(BugIcon)
export const IconChart = make(Chart2Icon)
export const IconPeople = make(UsersGroupRoundedIcon)
export const IconMegaphone = make(VolumeLoudIcon)
export const IconChevronRight = make(AltArrowRightIcon)
export const IconChevronDown = make(AltArrowDownIcon)
export const IconMore = make(MenuDotsVerticalIcon)
export const IconLink = make(LinkRoundIcon)
export const IconArchive = make(ArchiveMinimalisticIcon)
export const IconBlock = make(ForbiddenCircleIcon)
export const IconTag = make(TagIcon)
export const IconLeave = make(LogoutIcon)
export const IconCopy = make(CopyIcon)
export const IconBell = make(BellIcon)
export const IconBackup = make(CloudUploadIcon)
export const IconPhone = make(SmartphoneIcon)
export const IconCalendar = make(CalendarIcon)
export const IconCall = make(PhoneCallingRoundedIcon)
export const IconEndCall = make(EndCallRoundedIcon)
export const IconVideo = make(VideocameraIcon)
export const IconVideoOff = make(VideocameraOffIcon)
export const IconMic = make(MicrophoneIcon)
export const IconSpeaker = make(VolumeLoudIcon)
export const IconCallIn = make(IncomingCallRoundedIcon)
export const IconCallOut = make(OutgoingCallRoundedIcon)
export const IconCallMissed = make(CallDroppedRoundedIcon)
