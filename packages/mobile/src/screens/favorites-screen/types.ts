import type { Collection } from '@/common'

export type ExtendedCollection = Collection & {
  ownerHandle: string
  ownerName: string
}
