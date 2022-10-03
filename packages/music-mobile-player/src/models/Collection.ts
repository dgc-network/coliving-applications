import type { CID, Nullable } from '@coliving/common'

export type CollectionImage = {
  cover_art: Nullable<CID>
  cover_art_sizes: Nullable<CID>
}
