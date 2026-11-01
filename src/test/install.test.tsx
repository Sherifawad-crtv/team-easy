import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { InstallSheet } from '../features/install/InstallSheet'

afterEach(cleanup)

describe('add to home screen sheet', () => {
  it('shows the three Share steps on iPhone Safari with a pointer to the Share button', () => {
    render(<InstallSheet mode="ios-safari" onClose={() => {}} />)
    expect(screen.getByText('Tap the Share button')).toBeTruthy()
    expect(screen.getByText('Choose Add to Home Screen')).toBeTruthy()
    expect(screen.getByText('Tap Add')).toBeTruthy()
    expect(document.querySelector('.ipointer')).not.toBeNull()
    expect(screen.getByText('Share button is down here')).toBeTruthy()
  })

  it('points other iPhone browsers to the menu and to Safari', () => {
    render(<InstallSheet mode="ios-other" onClose={() => {}} />)
    expect(screen.getByText(/Share button or the ⋯ menu/)).toBeTruthy()
    expect(document.querySelector('.ipointer')).toBeNull()
  })

  it('asks people in another app to open their browser, with a link to copy', () => {
    render(<InstallSheet mode="in-app" onClose={() => {}} />)
    expect(screen.getByText('Open in your browser first')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Copy link/ })).toBeTruthy()
  })

  it('offers one button where the browser has an install prompt, and a way to close', () => {
    let closed = false
    render(<InstallSheet mode="prompt" onClose={() => { closed = true }} />)
    expect(screen.getByRole('button', { name: 'Add to home screen' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(closed).toBe(true)
  })

  it('says so when it is already installed', () => {
    render(<InstallSheet mode="installed" onClose={() => {}} />)
    expect(screen.getByText("It's already on your home screen.")).toBeTruthy()
  })
})
