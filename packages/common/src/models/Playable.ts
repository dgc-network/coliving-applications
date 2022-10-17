import { PlayableType } from 'models/identifiers'

import { DigitalContent } from './digitalContent'
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
      metadata: DigitalContent | null
      type: PlayableType.DIGITAL_CONTENT
    }
