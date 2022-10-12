import { Kind, removeNullable, Uid } from '@coliving/common'
import { keyBy } from 'lodash'
import moment from 'moment'
import { select, call } from 'redux-saga/effects'

import { retrieveAgreements } from 'common/store/cache/agreements/utils'
import {
  PREFIX,
  agreementsActions
} from 'common/store/pages/collection/lineup/actions'
import {
  getCollection,
  getSmartCollectionVariant,
  getCollectionId,
  getCollectionAgreementsLineup
} from 'common/store/pages/collection/selectors'
import { getCollection as getSmartCollection } from 'common/store/pages/smartCollection/selectors'
import { getPositions } from 'common/store/queue/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { waitForValue } from 'utils/sagaHelpers'

function* getCollectionAgreements() {
  const smartCollectionVariant = yield select(getSmartCollectionVariant)
  let collection
  if (smartCollectionVariant) {
    collection = yield select(getSmartCollection, {
      variant: smartCollectionVariant
    })
  } else {
    collection = yield call(waitForValue, getCollection)
  }

  const digital_content = collection.content_list_contents.digital_content_ids

  const agreementIds = digital_content.map((t) => t.digital_content)
  // TODO: Conform all timestamps to be of the same format so we don't have to do any special work here.
  const times = digital_content.map((t) => t.time)

  // Reconcile fetching this contentList with the queue.
  // Search the queue for its currently playing uids. If any are sourced
  // from `this` collection, use their uids rather than allowing
  // the lineup to generate fresh ones.
  // This allows the user to navigate back and forth between contentLists and other
  // pages without losing their currently playing position in the contentList.
  // TODO: Investigate a better pattern to solve this.
  const queueUids = Object.keys(yield select(getPositions)).map((uid) =>
    Uid.fromString(uid)
  )
  const thisSource = yield select(sourceSelector)
  // Gets uids in the queue for this source in the form: { id: [uid1, uid2] }
  // as there might be two uids in the contentList for the same id.
  const uidForSource = queueUids
    .filter((uid) => uid.source === thisSource)
    .reduce((mapping, uid) => {
      if (uid.id in mapping) {
        mapping[uid.id].push(uid.toString())
      } else {
        mapping[uid.id] = [uid.toString()]
      }
      return mapping
    }, {})

  if (agreementIds.length > 0) {
    const agreementMetadatas = yield call(retrieveAgreements, { agreementIds })
    const keyedMetadatas = keyBy(agreementMetadatas, (m) => m.digital_content_id)

    return agreementIds
      .map((id, i) => {
        const metadata = { ...keyedMetadatas[id] }

        // For whatever reason, the digital_content id was retrieved and doesn't exist or is malformatted.
        // This can happen if the collection references an unlisted digital_content or one that
        // doesn't (or never has) existed.
        if (!metadata.digital_content_id) return null

        if (times[i]) {
          metadata.dateAdded =
            typeof times[i] === 'string'
              ? moment(times[i])
              : moment.unix(times[i])
        }
        if (uidForSource[id] && uidForSource[id].length > 0) {
          metadata.uid = uidForSource[id].shift()
        } else if (digital_content[i].uid) {
          metadata.uid = digital_content[i].uid
        }
        return metadata
      })
      .filter(removeNullable)
  }
  return []
}

const keepDateAdded = (digital_content) => ({
  uid: digital_content.uid,
  kind: Kind.AGREEMENTS,
  dateAdded: digital_content.dateAdded
})

const sourceSelector = (state) => `collection:${getCollectionId(state)}`

class AgreementsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      agreementsActions,
      getCollectionAgreementsLineup,
      getCollectionAgreements,
      keepDateAdded,
      /* removeDeleted */ false,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new AgreementsSagas().getSagas()
}
