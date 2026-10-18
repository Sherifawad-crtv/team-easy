import type { Api } from './api'
import { mockApi } from './mock/mockApi'

// The one place that decides which backend the screens talk to.
// Going live means returning a real implementation here instead of the mock.
export const api: Api = mockApi
