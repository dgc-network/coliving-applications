import { createSelector } from 'reselect'

import { getAgreement } from 'common/store/cache/agreements/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import { AppState } from 'store/types'

export const getHasAgreement = (state: AppState) => !!state.player.agreementId
export const getUid = (state: AppState) => state.player.uid
export const getAgreementId = (state: AppState) => state.player.agreementId
export const getCollectible = (state: AppState) => state.player.collectible
export const getAudio = (state: AppState) => state.player.digitalcoin

export const getPlaying = (state: AppState) => state.player.playing
export const getPaused = (state: AppState) => !state.player.playing
export const getCounter = (state: AppState) => state.player.counter
export const getBuffering = (state: AppState) => state.player.buffering

export const getCurrentAgreement = (state: AppState) =>
  getAgreement(state, { id: getAgreementId(state) })
const getCurrentUser = (state: AppState) => {
  const digital_content = getCurrentAgreement(state)
  if (digital_content) {
    return getUser(state, { id: digital_content.owner_id })
  }
  return null
}

export const makeGetCurrent = () => {
  return createSelector(
    [getUid, getCurrentAgreement, getCurrentUser, getCollectible],
    (uid, digital_content, user, collectible) => ({
      uid,
      digital_content,
      user,
      collectible
    })
  )
}
