import { getAgreement as getCachedAgreement } from 'common/store/cache/agreements/selectors'
import { getUserFromAgreement } from 'common/store/cache/users/selectors'
import { AppState } from 'store/types'

const getBaseState = (state: AppState) =>
  state.application.ui.remixSettingsModal
const getAgreementId = (state: AppState) => getBaseState(state).agreementId

export const getStatus = (state: AppState) => getBaseState(state).status

export const getAgreement = (state: AppState) => {
  const id = getAgreementId(state)
  if (!id) return null
  return getCachedAgreement(state, { id })
}

export const getUser = (state: AppState) => {
  const id = getAgreementId(state)
  if (!id) return null
  return getUserFromAgreement(state, { id })
}
