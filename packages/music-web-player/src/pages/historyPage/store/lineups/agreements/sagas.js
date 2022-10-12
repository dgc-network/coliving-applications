import { Kind } from '@coliving/common'
import { keyBy } from 'lodash'
import { call, select } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import {
  PREFIX,
  agreementsActions
} from 'common/store/pages/historyPage/lineups/agreements/actions'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { LineupSagas } from 'store/lineup/sagas'

function* getHistoryAgreements() {
  try {
    const currentUserId = yield select(getUserId)
    const activity = yield apiClient.getUserAgreementHistory({
      currentUserId,
      userId: currentUserId,
      limit: 100
    })

    const processedAgreements = yield call(
      processAndCacheAgreements,
      activity.map((a) => a.digital_content)
    )
    const processedAgreementsMap = keyBy(processedAgreements, 'digital_content_id')

    const lineupAgreements = []
    activity.forEach((activity, i) => {
      const agreementMetadata = processedAgreementsMap[activity.digital_content.digital_content_id]
      // Prevent history for invalid agreements from getting into the lineup.
      if (agreementMetadata) {
        lineupAgreements.push({
          ...agreementMetadata,
          dateListened: activity.timestamp
        })
      }
    })
    return lineupAgreements
  } catch (e) {
    console.error(e)
    return []
  }
}

const keepAgreementIdAndDateListened = (entry) => ({
  uid: entry.uid,
  kind: entry.digital_content_id ? Kind.AGREEMENTS : Kind.COLLECTIONS,
  id: entry.digital_content_id || entry.content_list_id,
  dateListened: entry.dateListened
})

const sourceSelector = () => PREFIX

class AgreementsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      agreementsActions,
      // store => store.history.agreements,
      (store) => store.pages.historyPage.agreements,
      getHistoryAgreements,
      keepAgreementIdAndDateListened,
      /* removeDeleted */ false,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new AgreementsSagas().getSagas()
}
