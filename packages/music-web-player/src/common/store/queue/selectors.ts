import { UID } from '@coliving/common'
import { createSelector } from 'reselect'

import { CommonState } from 'common/store'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import {
  getUid as getPlayerUid,
  getDigitalContentId as getPlayerDigitalContentId
} from 'store/player/selectors'
import { AppState } from 'store/types'

export const getOrder = (state: CommonState) => state.queue.order
export const getLength = (state: CommonState) => state.queue.order.length
export const getOvershot = (state: CommonState) => state.queue.overshot
export const getUndershot = (state: CommonState) => state.queue.undershot
export const getPositions = (state: CommonState) => state.queue.positions
export const getIndex = (state: CommonState) => state.queue.index
export const getRepeat = (state: CommonState) => state.queue.repeat
export const getQueueAutoplay = (state: CommonState) =>
  state.queue.queueAutoplay
export const getShuffle = (state: CommonState) => state.queue.shuffle
export const getShuffleIndex = (state: CommonState) => state.queue.shuffleIndex
export const getShuffleOrder = (state: CommonState) => state.queue.shuffleOrder
export const getUidInQueue = (state: CommonState, props: { uid: UID }) =>
  props.uid in getPositions(state)

const isQueueIndexValid = (state: CommonState) =>
  state.queue.index >= 0 &&
  state.queue.order.length > 0 &&
  state.queue.index < state.queue.order.length

export const getUid = (state: CommonState) =>
  isQueueIndexValid(state) ? state.queue.order[state.queue.index].uid : null
export const getSource = (state: CommonState) =>
  isQueueIndexValid(state) ? state.queue.order[state.queue.index].source : null
export const getId = (state: CommonState) =>
  isQueueIndexValid(state) ? state.queue.order[state.queue.index].id : null
export const getCollectible = (state: CommonState) => {
  if (!isQueueIndexValid(state)) return null
  return state.queue.order[state.queue.index].collectible ?? null
}

const getCurrentDigitalContent = (state: AppState) =>
  getDigitalContent(state, { id: getPlayerDigitalContentId(state) })
const getCurrentUser = (state: AppState) => {
  const digital_content = getCurrentDigitalContent(state)
  const queueable = state.queue.order[state.queue.index]
  if (digital_content || queueable?.landlordId) {
    return getUser(state, { id: digital_content?.owner_id ?? queueable.landlordId })
  }
  return null
}

export const makeGetCurrent = () => {
  return createSelector(
    [getPlayerUid, getSource, getCurrentDigitalContent, getCurrentUser, getCollectible],
    (uid, source, digital_content, user, collectible) => ({
      uid,
      source,
      digital_content,
      user,
      collectible
    })
  )
}
