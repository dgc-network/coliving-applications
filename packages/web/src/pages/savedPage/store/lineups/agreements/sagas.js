import { Kind, makeUid } from '@coliving/common'
import moment from 'moment'
import { call, select, put, takeEvery } from 'redux-saga/effects'

import { getAgreements as getCacheAgreements } from 'common/store/cache/agreements/selectors'
import { retrieveAgreements } from 'common/store/cache/agreements/utils'
import * as saveActions from 'common/store/pages/savedPage/actions'
import {
  PREFIX,
  agreementsActions as savedAgreementsActions
} from 'common/store/pages/savedPage/lineups/agreements/actions'
import {
  getLocalSaves,
  getLocalSave,
  getSavedAgreementsLineupUid,
  getSaves
} from 'common/store/pages/savedPage/selectors'
import * as queueActions from 'common/store/queue/slice'
import { SAVE_AGREEMENT, UNSAVE_AGREEMENT } from 'common/store/social/agreements/actions'
import { LineupSagas } from 'store/lineup/sagas'
import { getUid as getPlayerUid } from 'store/player/selectors'

const getSavedAgreements = (state) => state.pages.savedPage.agreements

function* getAgreements() {
  const savedAgreements = yield select(getSaves)
  const savedAgreementIds = savedAgreements.map((save) => save.save_item_id)
  const savedAgreementTimestamps = savedAgreements.reduce((map, save) => {
    map[save.save_item_id] = save.created_at
    return map
  }, {})

  const localSaves = yield select(getLocalSaves)
  const localSavedAgreementIds = Object.keys(localSaves).filter(
    (savedAgreementId) => !savedAgreementTimestamps[savedAgreementId]
  )
  const localSavedAgreementTimestamps = localSavedAgreementIds.reduce((map, saveId) => {
    map[saveId] = Date.now()
    return map
  }, {})

  const allSavedAgreementIds = [...localSavedAgreementIds, ...savedAgreementIds]
  const allSavedAgreementTimestamps = {
    ...localSavedAgreementTimestamps,
    ...savedAgreementTimestamps
  }

  if (allSavedAgreementIds.length > 0) {
    const agreements = yield call(retrieveAgreements, { agreementIds: allSavedAgreementIds })
    const agreementsMap = agreements.reduce((map, agreement) => {
      // If the agreement hasn't confirmed save from the backend, pretend it is for the client.
      if (!agreement.has_current_user_saved) {
        agreement.has_current_user_saved = true
        agreement.save_count += 1
      }
      agreement.dateSaved = allSavedAgreementTimestamps[agreement.agreement_id]

      map[agreement.agreement_id] = agreement
      return map
    }, {})
    return allSavedAgreementIds.map((id) => agreementsMap[id])
  }
  return []
}

const keepDateSaved = (entry) => ({
  uid: entry.uid,
  kind: entry.agreement_id ? Kind.AGREEMENTS : Kind.COLLECTIONS,
  id: entry.agreement_id || entry.content_list_id,
  dateSaved: entry.dateSaved
})

const sourceSelector = () => PREFIX

class SavedAgreementsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      savedAgreementsActions,
      getSavedAgreements,
      getAgreements,
      keepDateSaved,
      /* removeDeleted */ false,
      sourceSelector
    )
  }
}

// If a local save is being done and the user is on the saved page route, make sure to update the lineup.
function* watchSave() {
  yield takeEvery(SAVE_AGREEMENT, function* (action) {
    const { agreementId } = action

    const agreements = yield select(getCacheAgreements, { ids: [agreementId] })
    const agreement = agreements[agreementId]
    if (agreement.has_current_user_saved) return

    const localSaveUid = makeUid(
      Kind.AGREEMENTS,
      agreementId,
      savedAgreementsActions.PREFIX
    )

    const newEntry = {
      uid: localSaveUid,
      kind: Kind.AGREEMENTS,
      id: agreementId,
      dateSaved: moment().format()
    }
    yield put(saveActions.addLocalSave(agreementId, localSaveUid))
    yield put(savedAgreementsActions.add(newEntry, agreementId))
    yield put(
      queueActions.add({
        entries: [
          {
            id: agreementId,
            uid: localSaveUid,
            souce: savedAgreementsActions.PREFIX
          }
        ]
      })
    )
  })
}

function* watchUnsave() {
  yield takeEvery(UNSAVE_AGREEMENT, function* (action) {
    const { agreementId } = action
    const localSaveUid = yield select(getLocalSave, { id: agreementId })
    const playerUid = yield select(getPlayerUid)
    yield put(saveActions.removeLocalSave(action.agreementId))
    if (localSaveUid) {
      yield put(savedAgreementsActions.remove(Kind.AGREEMENTS, localSaveUid))
      if (localSaveUid !== playerUid) {
        yield put(queueActions.remove({ uid: localSaveUid }))
      }
    }
    const lineupSaveUid = yield select(getSavedAgreementsLineupUid, { id: agreementId })
    if (lineupSaveUid) {
      yield put(savedAgreementsActions.remove(Kind.AGREEMENTS, lineupSaveUid))
      if (lineupSaveUid !== playerUid) {
        yield put(queueActions.remove({ uid: lineupSaveUid }))
      }
    }
  })
}

export default function sagas() {
  return new SavedAgreementsSagas().getSagas().concat(watchSave, watchUnsave)
}
