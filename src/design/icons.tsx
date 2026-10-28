import type { ReactNode, SVGProps } from 'react'

function Svg({ children, size = 24, ...rest }: SVGProps<SVGSVGElement> & { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  )
}
type P = { size?: number }

export const IconChat = (p: P) => <Svg {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" /></Svg>
export const IconUser = (p: P) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
export const IconEdit = (p: P) => <Svg {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></Svg>
export const IconCheck = (p: P) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>
export const IconTick = (p: P) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>
export const IconDoubleTick = (p: P) => <Svg {...p}><path d="m2 12.5 4.5 4.5L16 7.5M10 16.5l1 1L21 7.5" /></Svg>
export const IconClock = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
export const IconDocument = (p: P) => <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Svg>
export const IconDownload = (p: P) => <Svg {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></Svg>
export const IconAttach = (p: P) => <Svg {...p}><path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7" /></Svg>
export const IconPlus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const IconSearch = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
export const IconBack = (p: P) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>
export const IconClose = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
export const IconEye = (p: P) => <Svg {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Svg>
export const IconEyeOff = (p: P) => <Svg {...p}><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6A17 17 0 0 0 2 12s3.6 6 10 6a9.7 9.7 0 0 0 4.2-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Svg>
export const IconSend = (p: P) => <Svg {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></Svg>
export const IconInfo = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>
export const IconAlert = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5h.01" /></Svg>
export const IconCheckCircle = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></Svg>
export const IconWifiOff = (p: P) => <Svg {...p}><path d="M3 3l18 18M5 10.5a11 11 0 0 1 4-2.2M19 10.5a11 11 0 0 0-4.5-2.4M8.5 14a6 6 0 0 1 2.2-1.4M15.5 14a6 6 0 0 0-1.5-1.1M12 18h.01" /></Svg>
export const IconTrash = (p: P) => <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>
export const IconRetry = (p: P) => <Svg {...p}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></Svg>
export const IconCamera = (p: P) => <Svg {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4Z" /><circle cx="12" cy="13" r="3.5" /></Svg>
export const IconBug = (p: P) => <Svg {...p}><rect x="8" y="8" width="8" height="12" rx="4" /><path d="M9 8a3 3 0 0 1 6 0M4 13h4M16 13h4M5 7l3 2M19 7l-3 2M5 19l3-2M19 19l-3-2" /></Svg>
export const IconChart = (p: P) => <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>
export const IconPeople = (p: P) => <Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 20a6 6 0 0 0-2.5-4.9" /></Svg>
export const IconMegaphone = (p: P) => <Svg {...p}><path d="M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1ZM15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /></Svg>
export const IconChevronRight = (p: P) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
export const IconChevronDown = (p: P) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
export const IconMore = (p: P) => <Svg {...p}><circle cx="12" cy="5" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="12" cy="19" r="1.2" /></Svg>
export const IconLink = (p: P) => <Svg {...p}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></Svg>
export const IconArchive = (p: P) => <Svg {...p}><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" /></Svg>
export const IconBlock = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></Svg>
export const IconTag = (p: P) => <Svg {...p}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z" /><circle cx="8" cy="8" r="1.2" /></Svg>
export const IconLeave = (p: P) => <Svg {...p}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" /></Svg>
export const IconCopy = (p: P) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></Svg>
