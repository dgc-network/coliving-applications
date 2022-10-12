import {
  ID,
  CID,
  RepostSource,
  FavoriteSource,
  ShareSource
} from '@coliving/common'
import { createCustomAction } from 'typesafe-actions'

export const REPOST_AGREEMENT = 'SOCIAL/REPOST_AGREEMENT'
export const UNDO_REPOST_AGREEMENT = 'SOCIAL/UNDO_REPOST_AGREEMENT'
export const REPOST_FAILED = 'SOCIAL/AGREEMENT_REPOST_FAILED'

export const SAVE_AGREEMENT = 'SOCIAL/SAVE_AGREEMENT'
export const SAVE_AGREEMENT_SUCCEEDED = 'SOCIAL/SAVE_AGREEMENT_SUCCEEDED'
export const SAVE_AGREEMENT_FAILED = 'SOCIAL/SAVE_AGREEMENT_FAILED'

export const UNSAVE_AGREEMENT = 'SOCIAL/UNSAVE_AGREEMENT'
export const UNSAVE_AGREEMENT_SUCCEEDED = 'SOCIAL/UNSAVE_AGREEMENT_SUCCEEDED'
export const UNSAVE_AGREEMENT_FAILED = 'SOCIAL/UNSAVE_AGREEMENT_FAILED'

export const SET_LANDLORD_PICK = 'SOCIAL/SET_LANDLORD_PICK'
export const UNSET_LANDLORD_PICK = 'SOCIAL/UNSET_LANDLORD_PICK'

export const RECORD_LISTEN = 'SOCIAL/RECORD_LISTEN'
export const DOWNLOAD_AGREEMENT = 'SOCIAL/DOWNLOAD_AGREEMENT'

export const SHARE_AGREEMENT = 'SOCIAL/SHARE_AGREEMENT'

export const repostDigitalContent = createCustomAction(
  REPOST_AGREEMENT,
  (digitalContentId: ID, source: RepostSource) => ({ digitalContentId, source })
)

export const undoRepostDigitalContent = createCustomAction(
  UNDO_REPOST_AGREEMENT,
  (digitalContentId: ID, source: RepostSource) => ({ digitalContentId, source })
)

export const digitalContentRepostFailed = createCustomAction(
  REPOST_FAILED,
  (digitalContentId: ID, error: any) => ({ digitalContentId, error })
)

export const saveDigitalContent = createCustomAction(
  SAVE_AGREEMENT,
  (digitalContentId: ID, source: FavoriteSource) => ({ digitalContentId, source })
)

export const saveDigitalContentSucceeded = createCustomAction(
  SAVE_AGREEMENT_SUCCEEDED,
  (digitalContentId: ID) => ({ digitalContentId })
)

export const saveDigitalContentFailed = createCustomAction(
  SAVE_AGREEMENT_FAILED,
  (digitalContentId: ID, error: any) => ({ digitalContentId, error })
)

export const unsaveDigitalContent = createCustomAction(
  UNSAVE_AGREEMENT,
  (digitalContentId: ID, source: FavoriteSource) => ({ digitalContentId, source })
)

export const unsaveDigitalContentSucceeded = createCustomAction(
  UNSAVE_AGREEMENT_SUCCEEDED,
  (digitalContentId: ID) => ({ digitalContentId })
)

export const unsaveDigitalContentFailed = createCustomAction(
  UNSAVE_AGREEMENT_FAILED,
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
  DOWNLOAD_AGREEMENT,
  (digitalContentId: ID, cid: CID, contentNodeEndpoints: string, stemName?: string) => ({
    digitalContentId,
    cid,
    contentNodeEndpoints,
    stemName
  })
)

export const shareDigitalContent = createCustomAction(
  SHARE_AGREEMENT,
  (digitalContentId: ID, source: ShareSource) => ({ digitalContentId, source })
)
