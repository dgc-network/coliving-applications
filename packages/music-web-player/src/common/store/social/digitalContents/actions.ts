import {
  ID,
  CID,
  RepostSource,
  FavoriteSource,
  ShareSource
} from '@coliving/common'
import { createCustomAction } from 'typesafe-actions'

export const REPOST_DIGITAL_CONTENT = 'SOCIAL/REPOST_DIGITAL_CONTENT'
export const UNDO_REPOST_DIGITAL_CONTENT = 'SOCIAL/UNDO_REPOST_DIGITAL_CONTENT'
export const REPOST_FAILED = 'SOCIAL/DIGITAL_CONTENT_REPOST_FAILED'

export const SAVE_DIGITAL_CONTENT = 'SOCIAL/SAVE_DIGITAL_CONTENT'
export const SAVE_DIGITAL_CONTENT_SUCCEEDED = 'SOCIAL/SAVE_DIGITAL_CONTENT_SUCCEEDED'
export const SAVE_DIGITAL_CONTENT_FAILED = 'SOCIAL/SAVE_DIGITAL_CONTENT_FAILED'

export const UNSAVE_DIGITAL_CONTENT = 'SOCIAL/UNSAVE_DIGITAL_CONTENT'
export const UNSAVE_DIGITAL_CONTENT_SUCCEEDED = 'SOCIAL/UNSAVE_DIGITAL_CONTENT_SUCCEEDED'
export const UNSAVE_DIGITAL_CONTENT_FAILED = 'SOCIAL/UNSAVE_DIGITAL_CONTENT_FAILED'

export const SET_LANDLORD_PICK = 'SOCIAL/SET_LANDLORD_PICK'
export const UNSET_LANDLORD_PICK = 'SOCIAL/UNSET_LANDLORD_PICK'

export const RECORD_LISTEN = 'SOCIAL/RECORD_LISTEN'
export const DOWNLOAD_DIGITAL_CONTENT = 'SOCIAL/DOWNLOAD_DIGITAL_CONTENT'

export const SHARE_DIGITAL_CONTENT = 'SOCIAL/SHARE_DIGITAL_CONTENT'

export const repostDigitalContent = createCustomAction(
  REPOST_DIGITAL_CONTENT,
  (digitalContentId: ID, source: RepostSource) => ({ digitalContentId, source })
)

export const undoRepostDigitalContent = createCustomAction(
  UNDO_REPOST_DIGITAL_CONTENT,
  (digitalContentId: ID, source: RepostSource) => ({ digitalContentId, source })
)

export const digitalContentRepostFailed = createCustomAction(
  REPOST_FAILED,
  (digitalContentId: ID, error: any) => ({ digitalContentId, error })
)

export const saveDigitalContent = createCustomAction(
  SAVE_DIGITAL_CONTENT,
  (digitalContentId: ID, source: FavoriteSource) => ({ digitalContentId, source })
)

export const saveDigitalContentSucceeded = createCustomAction(
  SAVE_DIGITAL_CONTENT_SUCCEEDED,
  (digitalContentId: ID) => ({ digitalContentId })
)

export const saveDigitalContentFailed = createCustomAction(
  SAVE_DIGITAL_CONTENT_FAILED,
  (digitalContentId: ID, error: any) => ({ digitalContentId, error })
)

export const unsaveDigitalContent = createCustomAction(
  UNSAVE_DIGITAL_CONTENT,
  (digitalContentId: ID, source: FavoriteSource) => ({ digitalContentId, source })
)

export const unsaveDigitalContentSucceeded = createCustomAction(
  UNSAVE_DIGITAL_CONTENT_SUCCEEDED,
  (digitalContentId: ID) => ({ digitalContentId })
)

export const unsaveDigitalContentFailed = createCustomAction(
  UNSAVE_DIGITAL_CONTENT_FAILED,
  (digitalContentId: ID, error: any) => ({ digitalContentId, error })
)

export const setLandlordPick = createCustomAction(
  SET_LANDLORD_PICK,
  (digitalContentId: ID) => ({ digitalContentId })
)

export const unsetLandlordPick = createCustomAction(UNSET_LANDLORD_PICK, () => {
  console.log('author pick ')
})

export const recordListen = createCustomAction(
  RECORD_LISTEN,
  (digitalContentId: ID) => ({ digitalContentId })
)

export const downloadDigitalContent = createCustomAction(
  DOWNLOAD_DIGITAL_CONTENT,
  (digitalContentId: ID, cid: CID, contentNodeEndpoints: string, stemName?: string) => ({
    digitalContentId,
    cid,
    contentNodeEndpoints,
    stemName
  })
)

export const shareDigitalContent = createCustomAction(
  SHARE_DIGITAL_CONTENT,
  (digitalContentId: ID, source: ShareSource) => ({ digitalContentId, source })
)
