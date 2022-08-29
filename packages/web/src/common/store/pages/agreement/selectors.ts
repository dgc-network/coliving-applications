import { ID } from '@coliving/common'

import { CommonState } from 'common/store'
import {
  getAgreement as getCachedAgreement,
  getStatus as getCachedAgreementStatus
} from 'common/store/cache/agreements/selectors'
import { getUser as getCachedUser } from 'common/store/cache/users/selectors'
import { PREFIX } from 'common/store/pages/agreement/lineup/actions'

export const getBaseState = (state: CommonState) => state.pages.agreement

export const getAgreementId = (state: CommonState) => getBaseState(state).agreementId
export const getAgreementPermalink = (state: CommonState) =>
  getBaseState(state).agreementPermalink
export const getAgreement = (state: CommonState, params?: { id?: ID }) => {
  if (params?.id) {
    return getCachedAgreement(state, { id: params.id })
  }

  const id = getAgreementId(state)
  if (id) {
    return getCachedAgreement(state, { id })
  }
  const permalink = getAgreementPermalink(state)
  return getCachedAgreement(state, { permalink })
}

export const getRemixParentAgreement = (state: CommonState) => {
  const cachedAgreement = getAgreement(state)
  const parentAgreementId = cachedAgreement?.remix_of?.agreements?.[0].parent_agreement_id
  if (parentAgreementId) {
    const parentAgreement = getCachedAgreement(state, { id: parentAgreementId })
    // Get user for deactivated status
    const parentAgreementUser = getCachedUser(state, { id: parentAgreement?.owner_id })
    if (parentAgreement && parentAgreementUser) {
      return { ...parentAgreement, user: parentAgreementUser }
    }
  }
  return null
}

export const getUser = (state: CommonState, params?: { id?: ID }) => {
  const agreementId = params?.id ?? getAgreement(state)?.owner_id
  if (!agreementId) return null
  return getCachedUser(state, { id: agreementId })
}
export const getStatus = (state: CommonState) =>
  getCachedAgreementStatus(state, { id: getAgreementId(state) as ID })

export const getLineup = (state: CommonState) => getBaseState(state).agreements
export const getAgreementRank = (state: CommonState) => getBaseState(state).rank
export const getTrendingAgreementRanks = (state: CommonState) => {
  const ranks = getBaseState(state).trendingAgreementRanks
  if (!ranks.week && !ranks.month && !ranks.year) return null
  return ranks
}
export const getSourceSelector = (state: CommonState) =>
  `${PREFIX}:${getAgreementId(state)}`
