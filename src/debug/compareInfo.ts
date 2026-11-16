import { EXPERIMENT_IDS, type ExperimentId } from '../experiments/experiments'

// What the designer needs to judge each experiment: what differs, where to look
// and what to try. Kept next to the review tools, not in the app.

export interface CompareInfo {
  /** Short name for the quick switch. */
  short: string
  /** What A is and what B is, in a sentence each, for people who do not read the code. */
  a: string
  b: string
  /** Things to do on the screen to feel the difference. */
  tryIt: string[]
  /** The screen to open for the comparison. */
  open: { path: string; label: string }
}

export const COMPARE: Record<ExperimentId, CompareInfo> = {
  chat_list: {
    short: 'Chat list',
    a: 'A plain list, newest first.',
    b: 'Filter chips (All, Unread, Groups, Direct) and the announcements chat pinned on top.',
    tryIt: ['Find the chat you last wrote in', 'Tap Unread, then Groups (B only)'],
    open: { path: '/chats', label: 'Chat list' },
  },
  conversation: {
    short: 'Conversation',
    a: 'A time and ticks inside every message.',
    b: 'Messages that follow each other join up, and the time shows when you tap.',
    tryIt: ['Scroll back through a day of messages', 'Send a message and watch it settle'],
    open: { path: '/chats/c-product', label: 'Product Team chat' },
  },
  group_nav: {
    short: 'Groups',
    a: 'A nested tree you open level by level.',
    b: 'One flat list with the path under each name, and a find field.',
    tryIt: ['Find "Mobile design" inside Product Team', 'Open a group you have not used'],
    open: { path: '/groups', label: 'Groups' },
  },
  motion_style: {
    short: 'Motion',
    a: 'The first motion feel: Material style springs.',
    b: 'Apple-style springs, instant press feedback, haptics, screen slides, back swipe and draggable sheets.',
    tryIt: ['Open a chat and swipe back from the left edge', 'Pull a sheet down, flip a switch, long-press a message', 'Swipe a chat row sideways'],
    open: { path: '/chats', label: 'Chat list' },
  },
}

/** The experiments that show on a screen, the most relevant first. Motion style shows everywhere. */
export function experimentsFor(pathname: string): ExperimentId[] {
  if (/^\/chats\/[^/]+/.test(pathname)) return ['conversation', 'motion_style']
  if (pathname.startsWith('/chats')) return ['chat_list', 'motion_style']
  if (pathname.startsWith('/groups')) return ['group_nav', 'motion_style']
  return ['motion_style']
}

export const ALL_EXPERIMENTS = EXPERIMENT_IDS
