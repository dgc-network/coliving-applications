import { StemAgreement } from '@coliving/common'

import { getAgreement, getAgreements } from 'common/store/cache/agreements/selectors'
import { AppState } from 'store/types'

export const getBaseState = (state: AppState) =>
  state.application.ui.editAgreementModal

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
export const getAgreementId = (state: AppState) => getBaseState(state).agreementId

export const getMetadata = (state: AppState) => {
  const agreementId = getAgreementId(state)
  return getAgreement(state, { id: agreementId })
}

export const getStems = (state: AppState) => {
  const agreementId = getAgreementId(state)
  if (!agreementId) return []

  const digital_content = getAgreement(state, { id: agreementId })
  if (!digital_content?._stems?.length) return []

  const stemIds = digital_content._stems.map((s) => s.digital_content_id)

  const stemsMap = getAgreements(state, { ids: stemIds }) as {
    [id: number]: StemAgreement
  }
  const stems = Object.values(stemsMap).filter(
    (t) => !t.is_delete && !t._marked_deleted
  )
  return stems
}
