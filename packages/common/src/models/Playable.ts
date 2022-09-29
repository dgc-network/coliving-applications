import { PlayableType } from 'models/identifiers'

import { Agreement } from './agreement'
import { Collection } from './collection'

export type Playable =
  | {
      metadata: Collection | null
      type: PlayableType.CONTENT_LIST
    }
  | {
      metadata: Collection | null
      type: PlayableType.ALBUM
    }
  | {
      metadata: Agreement | null
      type: PlayableType.AGREEMENT
    }
