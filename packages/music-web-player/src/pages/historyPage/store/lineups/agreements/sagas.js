import { Kind } from '@coliving/common'
import { keyBy } from 'lodash'
import { call, select } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import {
  PREFIX,
  digitalContentsActions
} from 'common/store/pages/historyPage/lineups/digital_contents/actions'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { LineupSagas } from 'store/lineup/sagas'

function* getHistoryDigitalContents() {
  try {
    const currentUserId = yield select(getUserId)
    const activity = yield apiClient.getUserDigitalContentHistory({
      currentUserId,
      userId: currentUserId,
      limit: 100
    })

    const processedDigitalContents = yield call(
      processAndCacheDigitalContents,
      activity.map((a) => a.digital_content)
    )
    const processedDigitalContentsMap = keyBy(processedDigitalContents, 'digital_content_id')

    const lineupDigitalContents = []
    activity.forEach((activity, i) => {
      const digitalContentMetadata = processedDigitalContentsMap[activity.digital_content.digital_content_id]
      // Prevent history for invalid digitalContents from getting into the lineup.
      if (digitalContentMetadata) {
        lineupDigitalContents.push({
          ...digitalContentMetadata,
          dateListened: activity.timestamp
        })
      }
    })
    return lineupDigitalContents
  } catch (e) {
    console.error(e)
    return []
  }
}

const keepDigitalContentIdAndDateListened = (entry) => ({
  uid: entry.uid,
  kind: entry.digital_content_id ? Kind.DIGITAL_CONTENTS : Kind.COLLECTIONS,
  id: entry.digital_content_id || entry.content_list_id,
  dateListened: entry.dateListened
})

const sourceSelector = () => PREFIX

class DigitalContentsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      digitalContentsActions,
      // store => store.history.digitalContents,
      (store) => store.pages.historyPage.digitalContents,
      getHistoryDigitalContents,
      keepDigitalContentIdAndDateListened,
      /* removeDeleted */ false,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new DigitalContentsSagas().getSagas()
}
