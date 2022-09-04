import { PlayableType } from 'models/Identifiers'

import { Agreement } from './Agreement'
import { Collection } from './Collection'

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
