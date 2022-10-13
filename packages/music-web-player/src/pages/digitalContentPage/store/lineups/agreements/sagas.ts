import { call, select } from 'typed-redux-saga'

import { getUserId } from 'common/store/account/selectors'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { retrieveUserDigitalContents } from 'common/store/pages/profile/lineups/digital_contents/retrieveUserDigitalContents'
import { PREFIX, digitalContentsActions } from 'common/store/pages/digital_content/lineup/actions'
import {
  getLineup,
  getSourceSelector as sourceSelector
} from 'common/store/pages/digital_content/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { waitForValue } from 'utils/sagaHelpers'

function* getDigitalContents({
  payload,
  offset = 0,
  limit = 6
}: {
  payload: {
    ownerHandle: string
    /** Permalink of digital_content that should be loaded first */
    heroDigitalContentPermalink: string
  }
  offset?: number
  limit?: number
}) {
  const { ownerHandle, heroDigitalContentPermalink } = payload
  const currentUserId = yield* select(getUserId)

  const lineup = []
  const heroDigitalContent = yield* call(
    waitForValue,
    getDigitalContent,
    { permalink: heroDigitalContentPermalink },
    // Wait for the digital_content to have a digital_content_id (e.g. remix children could get fetched first)
    (digital_content) => digital_content.digital_content_id
  )
  if (offset === 0) {
    lineup.push(heroDigitalContent)
  }
  const heroDigitalContentRemixParentDigitalContentId =
    heroDigitalContent.remix_of?.digitalContents?.[0]?.parent_digital_content_id
  if (heroDigitalContentRemixParentDigitalContentId) {
    const remixParentDigitalContent = yield* call(waitForValue, getDigitalContent, {
      id: heroDigitalContentRemixParentDigitalContentId
    })
    if (offset <= 1) {
      lineup.push(remixParentDigitalContent)
    }
  }

  let moreByLandlordDigitalContentsOffset: number
  if (heroDigitalContentRemixParentDigitalContentId) {
    moreByLandlordDigitalContentsOffset = offset <= 1 ? 0 : offset - 2
  } else {
    moreByLandlordDigitalContentsOffset = offset === 0 ? 0 : offset - 1
  }

  const processed = yield* call(retrieveUserDigitalContents, {
    handle: ownerHandle,
    currentUserId,
    sort: 'plays',
    limit: limit + 2,
    // The hero digital_content is always our first digital_content and the remix parent is always the second digital_content (if any):
    offset: moreByLandlordDigitalContentsOffset
  })

  return lineup
    .concat(
      processed
        // Filter out any digital_content that matches the `excludePermalink` + the remix parent digital_content (if any)
        .filter(
          (t) =>
            t.permalink !== heroDigitalContentPermalink &&
            t.digital_content_id !== heroDigitalContentRemixParentDigitalContentId
        )
    )
    .slice(0, limit)
}

class DigitalContentsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      digitalContentsActions,
      getLineup,
      getDigitalContents,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new DigitalContentsSagas().getSagas()
}
