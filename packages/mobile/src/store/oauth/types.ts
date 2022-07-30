import type { Credentials as TikTokCredentials } from '-client/src/common/hooks/useTikTokAuth'

// Expand this type as more types of oauth are done on the native side
export type Credentials = TikTokCredentials & { error?: string }
