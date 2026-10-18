// Assumed rules (the PRD is silent): password 8+ characters with a letter and a number.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const validate = {
  name(v: string): string | undefined {
    const s = v.trim()
    if (!s) return 'Enter your name'
    if (s.length < 2) return 'Name needs at least 2 characters'
  },
  email(v: string): string | undefined {
    const s = v.trim()
    if (!s) return 'Enter your email address'
    if (!EMAIL.test(s)) return 'Enter a valid email address'
  },
  newPassword(v: string): string | undefined {
    if (!v) return 'Choose a password'
    if (v.length < 8) return 'Use at least 8 characters'
    if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return 'Include at least one letter and one number'
  },
  currentPassword(v: string): string | undefined {
    if (!v) return 'Enter your password'
  },
}
