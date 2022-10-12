import { createSelector } from 'reselect'

import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import { AppState } from 'store/types'

export const getHasDigitalContent = (state: AppState) => !!state.player.digitalContentId
export const getUid = (state: AppState) => state.player.uid
export const getDigitalContentId = (state: AppState) => state.player.digitalContentId
export const getCollectible = (state: AppState) => state.player.collectible
export const getAudio = (state: AppState) => state.player.digitalcoin

export const getPlaying = (state: AppState) => state.player.playing
export const getPaused = (state: AppState) => !state.player.playing
export const getCounter = (state: AppState) => state.player.counter
export const getBuffering = (state: AppState) => state.player.buffering

export const getCurrentDigitalContent = (state: AppState) =>
  getDigitalContent(state, { id: getDigitalContentId(state) })
const getCurrentUser = (state: AppState) => {
  const digital_content = getCurrentDigitalContent(state)
  if (digital_content) {
    return getUser(state, { id: digital_content.owner_id })
  }
  return null
}

export const makeGetCurrent = () => {
  return createSelector(
    [getUid, getCurrentDigitalContent, getCurrentUser, getCollectible],
    (uid, digital_content, user, collectible) => ({
      uid,
      digital_content,
      user,
      collectible
    })
  )
}
