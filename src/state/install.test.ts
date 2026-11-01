import { describe, expect, it } from 'vitest'
import { detectInstall, snoozed } from './install'

const SAFARI_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const CHROME_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1'
const INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0'
const WEBVIEW_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'

describe('which way to add the app to the home screen', () => {
  it('uses the browser prompt on Android once it is offered', () => {
    expect(detectInstall({ ua: CHROME_ANDROID, standalone: false, hasPrompt: true })).toBe('prompt')
    expect(detectInstall({ ua: CHROME_ANDROID, standalone: false, hasPrompt: false })).toBe('manual')
  })

  it('teaches the Share steps on iPhone, in Safari or another browser', () => {
    expect(detectInstall({ ua: SAFARI_IOS, standalone: false, hasPrompt: false })).toBe('ios-safari')
    expect(detectInstall({ ua: CHROME_IOS, standalone: false, hasPrompt: false })).toBe('ios-other')
  })

  it('treats an iPad that calls itself a Mac like an iPhone', () => {
    const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
    expect(detectInstall({ ua: mac, standalone: false, hasPrompt: false, touchMac: true })).toBe('ios-safari')
    expect(detectInstall({ ua: mac, standalone: false, hasPrompt: false })).toBe('manual')
  })

  it('says open it in a browser when it is inside another app', () => {
    expect(detectInstall({ ua: INSTAGRAM, standalone: false, hasPrompt: false })).toBe('in-app')
    expect(detectInstall({ ua: WEBVIEW_IOS, standalone: false, hasPrompt: false })).toBe('in-app')
  })

  it('knows when it is already on the home screen', () => {
    expect(detectInstall({ ua: SAFARI_IOS, standalone: true, hasPrompt: false })).toBe('installed')
  })

  it('stays quiet for a week after being hidden', () => {
    localStorage.clear()
    expect(snoozed()).toBe(false)
    localStorage.setItem('te.install.snooze', String(Date.now() - 2 * 86_400_000))
    expect(snoozed()).toBe(true)
    expect(snoozed(Date.now() + 8 * 86_400_000)).toBe(false)
  })
})
