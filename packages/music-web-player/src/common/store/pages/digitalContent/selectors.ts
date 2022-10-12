import { ID } from '@coliving/common'

import { CommonState } from 'common/store'
import {
  getDigitalContent as getCachedDigitalContent,
  getStatus as getCachedDigitalContentStatus
} from 'common/store/cache/digital_contents/selectors'
import { getUser as getCachedUser } from 'common/store/cache/users/selectors'
import { PREFIX } from 'common/store/pages/digital_content/lineup/actions'

export const getBaseState = (state: CommonState) => state.pages.digital_content

export const getDigitalContentId = (state: CommonState) => getBaseState(state).digitalContentId
export const getDigitalContentPermalink = (state: CommonState) =>
  getBaseState(state).digitalContentPermalink
export const getDigitalContent = (state: CommonState, params?: { id?: ID }) => {
  if (params?.id) {
    return getCachedDigitalContent(state, { id: params.id })
  }

  const id = getDigitalContentId(state)
  if (id) {
    return getCachedDigitalContent(state, { id })
  }
  const permalink = getDigitalContentPermalink(state)
  return getCachedDigitalContent(state, { permalink })
}

export const getRemixParentDigitalContent = (state: CommonState) => {
  const cachedDigitalContent = getDigitalContent(state)
  const parentDigitalContentId = cachedDigitalContent?.remix_of?.digitalContents?.[0].parent_digital_content_id
  if (parentDigitalContentId) {
    const parentDigitalContent = getCachedDigitalContent(state, { id: parentDigitalContentId })
    // Get user for deactivated status
    const parentDigitalContentUser = getCachedUser(state, { id: parentDigitalContent?.owner_id })
    if (parentDigitalContent && parentDigitalContentUser) {
      return { ...parentDigitalContent, user: parentDigitalContentUser }
    }
  }
  return null
}

export const getUser = (state: CommonState, params?: { id?: ID }) => {
  const digitalContentId = params?.id ?? getDigitalContent(state)?.owner_id
  if (!digitalContentId) return null
  return getCachedUser(state, { id: digitalContentId })
}
export const getStatus = (state: CommonState) =>
  getCachedDigitalContentStatus(state, { id: getDigitalContentId(state) as ID })

export const getLineup = (state: CommonState) => getBaseState(state).digitalContents
export const getDigitalContentRank = (state: CommonState) => getBaseState(state).rank
export const getTrendingDigitalContentRanks = (state: CommonState) => {
  const ranks = getBaseState(state).trendingDigitalContentRanks
  if (!ranks.week && !ranks.month && !ranks.year) return null
  return ranks
}
export const getSourceSelector = (state: CommonState) =>
  `${PREFIX}:${getDigitalContentId(state)}`
