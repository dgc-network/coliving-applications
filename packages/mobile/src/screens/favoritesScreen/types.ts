import type { Collection } from '@coliving/common'

export type ExtendedCollection = Collection & {
  ownerHandle: string
  ownerName: string
}
