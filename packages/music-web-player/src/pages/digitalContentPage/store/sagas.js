import { Kind, StringKeys, makeUid } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import moment from 'moment'
import { call, fork, put, select, takeEvery } from 'redux-saga/effects'

import * as digitalContentCacheActions from 'common/store/cache/digital_contents/actions'
import { getDigitalContent as getCachedDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { retrieveDigitalContents } from 'common/store/cache/digital_contents/utils'
import { retrieveDigitalContentByHandleAndSlug } from 'common/store/cache/digital_contents/utils/retrieveDigitalContents'
import { getUsers } from 'common/store/cache/users/selectors'
import * as digitalContentPageActions from 'common/store/pages/digital_content/actions'
import { digitalContentsActions } from 'common/store/pages/digital_content/lineup/actions'
import {
  getSourceSelector,
  getDigitalContent,
  getTrendingDigitalContentRanks,
  getUser
} from 'common/store/pages/digital_content/selectors'
import { getIsReachable } from 'common/store/reachability/selectors'
import digitalContentsSagas from 'pages/digital-content-page/store/lineups/digital_contents/sagas'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'
import { waitForBackendSetup } from 'store/backend/sagas'
import { NOT_FOUND_PAGE, digitalContentRemixesPage } from 'utils/route'

export const TRENDING_BADGE_LIMIT = 10

function* watchDigitalContentBadge() {
  yield takeEvery(digitalContentPageActions.GET_AGREEMENT_RANKS, function* (action) {
    try {
      yield call(waitForBackendSetup)
      yield call(remoteConfigInstance.waitForRemoteConfig)
      const TF = new Set(
        remoteConfigInstance.getRemoteVar(StringKeys.TF)?.split(',') ?? []
      )
      let trendingDigitalContentRanks = yield select(getTrendingDigitalContentRanks)
      if (!trendingDigitalContentRanks) {
        const trendingRanks = yield apiClient.getTrendingIds({
          limit: TRENDING_BADGE_LIMIT
        })
        if (TF.size > 0) {
          trendingRanks.week = trendingRanks.week.filter((i) => {
            const shaId = window.Web3.utils.sha3(i.toString())
            return !TF.has(shaId)
          })
          trendingRanks.month = trendingRanks.month.filter((i) => {
            const shaId = window.Web3.utils.sha3(i.toString())
            return !TF.has(shaId)
          })
          trendingRanks.year = trendingRanks.year.filter((i) => {
            const shaId = window.Web3.utils.sha3(i.toString())
            return !TF.has(shaId)
          })
        }

        yield put(digitalContentPageActions.setDigitalContentTrendingRanks(trendingRanks))
        trendingDigitalContentRanks = yield select(getTrendingDigitalContentRanks)
      }

      const weeklyDigitalContentIndex = trendingDigitalContentRanks.week.findIndex(
        (digitalContentId) => digitalContentId === action.digitalContentId
      )
      const monthlyDigitalContentIndex = trendingDigitalContentRanks.month.findIndex(
        (digitalContentId) => digitalContentId === action.digitalContentId
      )
      const yearlyDigitalContentIndex = trendingDigitalContentRanks.year.findIndex(
        (digitalContentId) => digitalContentId === action.digitalContentId
      )

      yield put(
        digitalContentPageActions.setDigitalContentRank(
          'week',
          weeklyDigitalContentIndex !== -1 ? weeklyDigitalContentIndex + 1 : null
        )
      )
      yield put(
        digitalContentPageActions.setDigitalContentRank(
          'month',
          monthlyDigitalContentIndex !== -1 ? monthlyDigitalContentIndex + 1 : null
        )
      )
      yield put(
        digitalContentPageActions.setDigitalContentRank(
          'year',
          yearlyDigitalContentIndex !== -1 ? yearlyDigitalContentIndex + 1 : null
        )
      )
    } catch (error) {
      console.error(`Unable to fetch digital_content badge: ${error.message}`)
    }
  })
}

function* getDigitalContentRanks(digitalContentId) {
  yield put(digitalContentPageActions.getDigitalContentRanks(digitalContentId))
}

function* addDigitalContentToLineup(digital_content) {
  const source = yield select(getSourceSelector)
  const formattedDigitalContent = {
    kind: Kind.AGREEMENTS,
    id: digital_content.digital_content_id,
    uid: makeUid(Kind.AGREEMENTS, digital_content.digital_content_id, source)
  }

  yield put(digitalContentsActions.add(formattedDigitalContent, digital_content.digital_content_id))
}

/** Get "more by this author" and put into the lineup + queue */
function* getRestOfLineup(permalink, ownerHandle) {
  yield put(
    digitalContentsActions.fetchLineupMetadatas(1, 5, false, {
      ownerHandle,
      heroDigitalContentPermalink: permalink
    })
  )
}

function* watchFetchDigitalContent() {
  yield takeEvery(digitalContentPageActions.FETCH_AGREEMENT, function* (action) {
    const { digitalContentId, handle, slug, canBeUnlisted } = action
    const permalink = `/${handle}/${slug}`
    try {
      let digital_content
      if (!digitalContentId) {
        digital_content = yield call(retrieveDigitalContentByHandleAndSlug, {
          handle,
          slug,
          withStems: true,
          withRemixes: true,
          withRemixParents: true
        })
      } else {
        const ids = canBeUnlisted
          ? [{ id: digitalContentId, url_title: slug, handle }]
          : [digitalContentId]
        const digitalContents = yield call(retrieveDigitalContents, {
          digitalContentIds: ids,
          canBeUnlisted,
          withStems: true,
          withRemixes: true,
          withRemixParents: true
        })
        digital_content = digitalContents && digitalContents.length === 1 ? digitalContents[0] : null
      }
      if (!digital_content) {
        const isReachable = yield select(getIsReachable)
        if (isReachable) {
          yield put(pushRoute(NOT_FOUND_PAGE))
          return
        }
      } else {
        yield put(digitalContentPageActions.setDigitalContentId(digital_content.digital_content_id))
        // Add hero digital_content to lineup early so that we can play it ASAP
        // (instead of waiting for the entire lineup to load)
        yield call(addDigitalContentToLineup, digital_content)
        yield fork(getRestOfLineup, permalink, handle)
        yield fork(getDigitalContentRanks, digital_content.digital_content_id)
        yield put(digitalContentPageActions.fetchDigitalContentSucceeded(digital_content.digital_content_id))
      }
    } catch (e) {
      console.error(e)
      yield put(
        digitalContentPageActions.fetchDigitalContentFailed(digitalContentId ?? `/${handle}/${slug}`)
      )
    }
  })
}

function* watchFetchDigitalContentSucceeded() {
  yield takeEvery(digitalContentPageActions.FETCH_AGREEMENT_SUCCEEDED, function* (action) {
    const { digitalContentId } = action
    const digital_content = yield select(getCachedDigitalContent, { id: digitalContentId })
    if (
      digital_content.download &&
      digital_content.download.is_downloadable &&
      !digital_content.download.cid
    ) {
      yield put(digitalContentCacheActions.checkIsDownloadable(digital_content.digital_content_id))
    }
  })
}

function* watchRefetchLineup() {
  yield takeEvery(digitalContentPageActions.REFETCH_LINEUP, function* (action) {
    const { permalink } = yield select(getDigitalContent)
    const { handle } = yield select(getUser)
    yield put(digitalContentsActions.reset())
    yield put(
      digitalContentsActions.fetchLineupMetadatas(0, 6, false, {
        ownerHandle: handle,
        heroDigitalContentPermalink: permalink
      })
    )
  })
}

function* watchDigitalContentPageMakePublic() {
  yield takeEvery(digitalContentPageActions.MAKE_AGREEMENT_PUBLIC, function* (action) {
    const { digitalContentId } = action
    let digital_content = yield select(getCachedDigitalContent, { id: digitalContentId })

    digital_content = {
      ...digital_content,
      is_unlisted: false,
      release_date: moment().toString(),
      field_visibility: {
        genre: true,
        mood: true,
        tags: true,
        share: true,
        play_count: true,
        remixes: digital_content.field_visibility?.remixes ?? true
      }
    }

    yield put(digitalContentCacheActions.editDigitalContent(digitalContentId, digital_content))
  })
}

function* watchGoToRemixesOfParentPage() {
  yield takeEvery(
    digitalContentPageActions.GO_TO_REMIXES_OF_PARENT_PAGE,
    function* (action) {
      const { parentDigitalContentId } = action
      if (parentDigitalContentId) {
        const parentDigitalContent = (yield call(retrieveDigitalContents, {
          digitalContentIds: [parentDigitalContentId]
        }))[0]
        if (parentDigitalContent) {
          const parentDigitalContentUser = (yield select(getUsers, {
            ids: [parentDigitalContent.owner_id]
          }))[parentDigitalContent.owner_id]
          if (parentDigitalContentUser) {
            const route = digitalContentRemixesPage(parentDigitalContent.permalink)
            yield put(pushRoute(route))
          }
        }
      }
    }
  )
}

export default function sagas() {
  return [
    ...digitalContentsSagas(),
    watchFetchDigitalContent,
    watchFetchDigitalContentSucceeded,
    watchRefetchLineup,
    watchDigitalContentBadge,
    watchDigitalContentPageMakePublic,
    watchGoToRemixesOfParentPage
  ]
}
