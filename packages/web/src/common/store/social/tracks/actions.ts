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

export const repostAgreement = createCustomAction(
  REPOST_AGREEMENT,
  (agreementId: ID, source: RepostSource) => ({ agreementId, source })
)

export const undoRepostAgreement = createCustomAction(
  UNDO_REPOST_AGREEMENT,
  (agreementId: ID, source: RepostSource) => ({ agreementId, source })
)

export const agreementRepostFailed = createCustomAction(
  REPOST_FAILED,
  (agreementId: ID, error: any) => ({ agreementId, error })
)

export const saveAgreement = createCustomAction(
  SAVE_AGREEMENT,
  (agreementId: ID, source: FavoriteSource) => ({ agreementId, source })
)

export const saveAgreementSucceeded = createCustomAction(
  SAVE_AGREEMENT_SUCCEEDED,
  (agreementId: ID) => ({ agreementId })
)

export const saveAgreementFailed = createCustomAction(
  SAVE_AGREEMENT_FAILED,
  (agreementId: ID, error: any) => ({ agreementId, error })
)

export const unsaveAgreement = createCustomAction(
  UNSAVE_AGREEMENT,
  (agreementId: ID, source: FavoriteSource) => ({ agreementId, source })
)

export const unsaveAgreementSucceeded = createCustomAction(
  UNSAVE_AGREEMENT_SUCCEEDED,
  (agreementId: ID) => ({ agreementId })
)

export const unsaveAgreementFailed = createCustomAction(
  UNSAVE_AGREEMENT_FAILED,
  (agreementId: ID, error: any) => ({ agreementId, error })
)

export const setLandlordPick = createCustomAction(
  SET_LANDLORD_PICK,
  (agreementId: ID) => ({ agreementId })
)

export const unsetLandlordPick = createCustomAction(UNSET_LANDLORD_PICK, () => {
  console.log('landlord pick ')
})

export const recordListen = createCustomAction(
  RECORD_LISTEN,
  (agreementId: ID) => ({ agreementId })
)

export const downloadAgreement = createCustomAction(
  DOWNLOAD_AGREEMENT,
  (agreementId: ID, cid: CID, contentNodeEndpoints: string, stemName?: string) => ({
    agreementId,
    cid,
    contentNodeEndpoints,
    stemName
  })
)

export const shareAgreement = createCustomAction(
  SHARE_AGREEMENT,
  (agreementId: ID, source: ShareSource) => ({ agreementId, source })
)
