/** Which store billed the person, guessed from the browser. Real builds know this from the store. */
export type StorePlatform = 'ios' | 'android' | 'other'

export function storePlatform(): StorePlatform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'other'
}

export const storeName = (p: StorePlatform = storePlatform()) => (p === 'ios' ? 'App Store' : p === 'android' ? 'Google Play' : 'app store')
