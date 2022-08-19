import { PlayableType } from 'models/Identifiers'

import { Collection } from './Collection'
import { Agreement } from './Agreement'

export type Playable =
  | {
      metadata: Collection | null
      type: PlayableType.PLAYLIST
    }
  | {
      metadata: Collection | null
      type: PlayableType.ALBUM
    }
  | {
      metadata: Agreement | null
      type: PlayableType.AGREEMENT
    }
