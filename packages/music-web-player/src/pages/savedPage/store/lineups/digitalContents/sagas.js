import { Kind, makeUid } from '@coliving/common'
import moment from 'moment'
import { call, select, put, takeEvery } from 'redux-saga/effects'

import { getDigitalContents as getCacheDigitalContents } from 'common/store/cache/digital_contents/selectors'
import { retrieveDigitalContents } from 'common/store/cache/digital_contents/utils'
import * as saveActions from 'common/store/pages/savedPage/actions'
import {
  PREFIX,
  digitalContentsActions as savedDigitalContentsActions
} from 'common/store/pages/savedPage/lineups/digital_contents/actions'
import {
  getLocalSaves,
  getLocalSave,
  getSavedDigitalContentsLineupUid,
  getSaves
} from 'common/store/pages/savedPage/selectors'
import * as queueActions from 'common/store/queue/slice'
import { SAVE_DIGITAL_CONTENT, UNSAVE_DIGITAL_CONTENT } from 'common/store/social/digital_contents/actions'
import { LineupSagas } from 'store/lineup/sagas'
import { getUid as getPlayerUid } from 'store/player/selectors'

const getSavedDigitalContents = (state) => state.pages.savedPage.digitalContents

function* getDigitalContents() {
  const savedDigitalContents = yield select(getSaves)
  const savedDigitalContentIds = savedDigitalContents.map((save) => save.save_item_id)
  const savedDigitalContentTimestamps = savedDigitalContents.reduce((map, save) => {
    map[save.save_item_id] = save.created_at
    return map
  }, {})

  const localSaves = yield select(getLocalSaves)
  const localSavedDigitalContentIds = Object.keys(localSaves).filter(
    (savedDigitalContentId) => !savedDigitalContentTimestamps[savedDigitalContentId]
  )
  const localSavedDigitalContentTimestamps = localSavedDigitalContentIds.reduce((map, saveId) => {
    map[saveId] = Date.now()
    return map
  }, {})

  const allSavedDigitalContentIds = [...localSavedDigitalContentIds, ...savedDigitalContentIds]
  const allSavedDigitalContentTimestamps = {
    ...localSavedDigitalContentTimestamps,
    ...savedDigitalContentTimestamps
  }

  if (allSavedDigitalContentIds.length > 0) {
    const digitalContents = yield call(retrieveDigitalContents, { digitalContentIds: allSavedDigitalContentIds })
    const digitalContentsMap = digitalContents.reduce((map, digital_content) => {
      // If the digital_content hasn't confirmed save from the backend, pretend it is for the client.
      if (!digital_content.has_current_user_saved) {
        digital_content.has_current_user_saved = true
        digital_content.save_count += 1
      }
      digital_content.dateSaved = allSavedDigitalContentTimestamps[digital_content.digital_content_id]

      map[digital_content.digital_content_id] = digital_content
      return map
    }, {})
    return allSavedDigitalContentIds.map((id) => digitalContentsMap[id])
  }
  return []
}

const keepDateSaved = (entry) => ({
  uid: entry.uid,
  kind: entry.digital_content_id ? Kind.DIGITAL_CONTENTS : Kind.COLLECTIONS,
  id: entry.digital_content_id || entry.content_list_id,
  dateSaved: entry.dateSaved
})

const sourceSelector = () => PREFIX

class SavedDigitalContentsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      savedDigitalContentsActions,
      getSavedDigitalContents,
      getDigitalContents,
      keepDateSaved,
      /* removeDeleted */ false,
      sourceSelector
    )
  }
}

// If a local save is being done and the user is on the saved page route, make sure to update the lineup.
function* watchSave() {
  yield takeEvery(SAVE_DIGITAL_CONTENT, function* (action) {
    const { digitalContentId } = action

    const digitalContents = yield select(getCacheDigitalContents, { ids: [digitalContentId] })
    const digital_content = digitalContents[digitalContentId]
    if (digital_content.has_current_user_saved) return

    const localSaveUid = makeUid(
      Kind.DIGITAL_CONTENTS,
      digitalContentId,
      savedDigitalContentsActions.PREFIX
    )

    const newEntry = {
      uid: localSaveUid,
      kind: Kind.DIGITAL_CONTENTS,
      id: digitalContentId,
      dateSaved: moment().format()
    }
    yield put(saveActions.addLocalSave(digitalContentId, localSaveUid))
    yield put(savedDigitalContentsActions.add(newEntry, digitalContentId))
    yield put(
      queueActions.add({
        entries: [
          {
            id: digitalContentId,
            uid: localSaveUid,
            souce: savedDigitalContentsActions.PREFIX
          }
        ]
      })
    )
  })
}

function* watchUnsave() {
  yield takeEvery(UNSAVE_DIGITAL_CONTENT, function* (action) {
    const { digitalContentId } = action
    const localSaveUid = yield select(getLocalSave, { id: digitalContentId })
    const playerUid = yield select(getPlayerUid)
    yield put(saveActions.removeLocalSave(action.digitalContentId))
    if (localSaveUid) {
      yield put(savedDigitalContentsActions.remove(Kind.DIGITAL_CONTENTS, localSaveUid))
      if (localSaveUid !== playerUid) {
        yield put(queueActions.remove({ uid: localSaveUid }))
      }
    }
    const lineupSaveUid = yield select(getSavedDigitalContentsLineupUid, { id: digitalContentId })
    if (lineupSaveUid) {
      yield put(savedDigitalContentsActions.remove(Kind.DIGITAL_CONTENTS, lineupSaveUid))
      if (lineupSaveUid !== playerUid) {
        yield put(queueActions.remove({ uid: lineupSaveUid }))
      }
    }
  })
}

export default function sagas() {
  return new SavedDigitalContentsSagas().getSagas().concat(watchSave, watchUnsave)
}
