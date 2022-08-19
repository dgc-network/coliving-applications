import { CommonState } from 'common/store'
import { getAgreement as getCachedAgreement } from 'common/store/cache/agreements/selectors'
import { getUserFromAgreement } from 'common/store/cache/users/selectors'

export const getBaseState = (state: CommonState) => state.pages.remixes

export const getLineup = (state: CommonState) => getBaseState(state).agreements

export const getAgreementId = (state: CommonState) =>
  getBaseState(state).page.agreementId

export const getCount = (state: CommonState) => getBaseState(state).page.count

export const getAgreement = (state: CommonState) => {
  const id = getAgreementId(state)
  return getCachedAgreement(state, { id })
}

export const getUser = (state: CommonState) => {
  const id = getAgreementId(state)
  return getUserFromAgreement(state, { id })
}
