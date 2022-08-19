import { Kind, StringKeys, makeUid } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import moment from 'moment'
import { call, fork, put, select, takeEvery } from 'redux-saga/effects'

import * as agreementCacheActions from 'common/store/cache/agreements/actions'
import { getAgreement as getCachedAgreement } from 'common/store/cache/agreements/selectors'
import { retrieveAgreements } from 'common/store/cache/agreements/utils'
import { retrieveAgreementByHandleAndSlug } from 'common/store/cache/agreements/utils/retrieveAgreements'
import { getUsers } from 'common/store/cache/users/selectors'
import * as agreementPageActions from 'common/store/pages/agreement/actions'
import { agreementsActions } from 'common/store/pages/agreement/lineup/actions'
import {
  getSourceSelector,
  getAgreement,
  getTrendingAgreementRanks,
  getUser
} from 'common/store/pages/agreement/selectors'
import { getIsReachable } from 'common/store/reachability/selectors'
import agreementsSagas from 'pages/agreement-page/store/lineups/agreements/sagas'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { waitForBackendSetup } from 'store/backend/sagas'
import { NOT_FOUND_PAGE, agreementRemixesPage } from 'utils/route'

export const TRENDING_BADGE_LIMIT = 10

function* watchAgreementBadge() {
  yield takeEvery(agreementPageActions.GET_AGREEMENT_RANKS, function* (action) {
    try {
      yield call(waitForBackendSetup)
      yield call(remoteConfigInstance.waitForRemoteConfig)
      const TF = new Set(
        remoteConfigInstance.getRemoteVar(StringKeys.TF)?.split(',') ?? []
      )
      let trendingAgreementRanks = yield select(getTrendingAgreementRanks)
      if (!trendingAgreementRanks) {
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

        yield put(agreementPageActions.setAgreementTrendingRanks(trendingRanks))
        trendingAgreementRanks = yield select(getTrendingAgreementRanks)
      }

      const weeklyAgreementIndex = trendingAgreementRanks.week.findIndex(
        (agreementId) => agreementId === action.agreementId
      )
      const monthlyAgreementIndex = trendingAgreementRanks.month.findIndex(
        (agreementId) => agreementId === action.agreementId
      )
      const yearlyAgreementIndex = trendingAgreementRanks.year.findIndex(
        (agreementId) => agreementId === action.agreementId
      )

      yield put(
        agreementPageActions.setAgreementRank(
          'week',
          weeklyAgreementIndex !== -1 ? weeklyAgreementIndex + 1 : null
        )
      )
      yield put(
        agreementPageActions.setAgreementRank(
          'month',
          monthlyAgreementIndex !== -1 ? monthlyAgreementIndex + 1 : null
        )
      )
      yield put(
        agreementPageActions.setAgreementRank(
          'year',
          yearlyAgreementIndex !== -1 ? yearlyAgreementIndex + 1 : null
        )
      )
    } catch (error) {
      console.error(`Unable to fetch agreement badge: ${error.message}`)
    }
  })
}

function* getAgreementRanks(agreementId) {
  yield put(agreementPageActions.getAgreementRanks(agreementId))
}

function* addAgreementToLineup(agreement) {
  const source = yield select(getSourceSelector)
  const formattedAgreement = {
    kind: Kind.AGREEMENTS,
    id: agreement.agreement_id,
    uid: makeUid(Kind.AGREEMENTS, agreement.agreement_id, source)
  }

  yield put(agreementsActions.add(formattedAgreement, agreement.agreement_id))
}

/** Get "more by this artist" and put into the lineup + queue */
function* getRestOfLineup(permalink, ownerHandle) {
  yield put(
    agreementsActions.fetchLineupMetadatas(1, 5, false, {
      ownerHandle,
      heroAgreementPermalink: permalink
    })
  )
}

function* watchFetchAgreement() {
  yield takeEvery(agreementPageActions.FETCH_AGREEMENT, function* (action) {
    const { agreementId, handle, slug, canBeUnlisted } = action
    const permalink = `/${handle}/${slug}`
    try {
      let agreement
      if (!agreementId) {
        agreement = yield call(retrieveAgreementByHandleAndSlug, {
          handle,
          slug,
          withStems: true,
          withRemixes: true,
          withRemixParents: true
        })
      } else {
        const ids = canBeUnlisted
          ? [{ id: agreementId, url_title: slug, handle }]
          : [agreementId]
        const agreements = yield call(retrieveAgreements, {
          agreementIds: ids,
          canBeUnlisted,
          withStems: true,
          withRemixes: true,
          withRemixParents: true
        })
        agreement = agreements && agreements.length === 1 ? agreements[0] : null
      }
      if (!agreement) {
        const isReachable = yield select(getIsReachable)
        if (isReachable) {
          yield put(pushRoute(NOT_FOUND_PAGE))
          return
        }
      } else {
        yield put(agreementPageActions.setAgreementId(agreement.agreement_id))
        // Add hero agreement to lineup early so that we can play it ASAP
        // (instead of waiting for the entire lineup to load)
        yield call(addAgreementToLineup, agreement)
        yield fork(getRestOfLineup, permalink, handle)
        yield fork(getAgreementRanks, agreement.agreement_id)
        yield put(agreementPageActions.fetchAgreementSucceeded(agreement.agreement_id))
      }
    } catch (e) {
      console.error(e)
      yield put(
        agreementPageActions.fetchAgreementFailed(agreementId ?? `/${handle}/${slug}`)
      )
    }
  })
}

function* watchFetchAgreementSucceeded() {
  yield takeEvery(agreementPageActions.FETCH_AGREEMENT_SUCCEEDED, function* (action) {
    const { agreementId } = action
    const agreement = yield select(getCachedAgreement, { id: agreementId })
    if (
      agreement.download &&
      agreement.download.is_downloadable &&
      !agreement.download.cid
    ) {
      yield put(agreementCacheActions.checkIsDownloadable(agreement.agreement_id))
    }
  })
}

function* watchRefetchLineup() {
  yield takeEvery(agreementPageActions.REFETCH_LINEUP, function* (action) {
    const { permalink } = yield select(getAgreement)
    const { handle } = yield select(getUser)
    yield put(agreementsActions.reset())
    yield put(
      agreementsActions.fetchLineupMetadatas(0, 6, false, {
        ownerHandle: handle,
        heroAgreementPermalink: permalink
      })
    )
  })
}

function* watchAgreementPageMakePublic() {
  yield takeEvery(agreementPageActions.MAKE_AGREEMENT_PUBLIC, function* (action) {
    const { agreementId } = action
    let agreement = yield select(getCachedAgreement, { id: agreementId })

    agreement = {
      ...agreement,
      is_unlisted: false,
      release_date: moment().toString(),
      field_visibility: {
        genre: true,
        mood: true,
        tags: true,
        share: true,
        play_count: true,
        remixes: agreement.field_visibility?.remixes ?? true
      }
    }

    yield put(agreementCacheActions.editAgreement(agreementId, agreement))
  })
}

function* watchGoToRemixesOfParentPage() {
  yield takeEvery(
    agreementPageActions.GO_TO_REMIXES_OF_PARENT_PAGE,
    function* (action) {
      const { parentAgreementId } = action
      if (parentAgreementId) {
        const parentAgreement = (yield call(retrieveAgreements, {
          agreementIds: [parentAgreementId]
        }))[0]
        if (parentAgreement) {
          const parentAgreementUser = (yield select(getUsers, {
            ids: [parentAgreement.owner_id]
          }))[parentAgreement.owner_id]
          if (parentAgreementUser) {
            const route = agreementRemixesPage(parentAgreement.permalink)
            yield put(pushRoute(route))
          }
        }
      }
    }
  )
}

export default function sagas() {
  return [
    ...agreementsSagas(),
    watchFetchAgreement,
    watchFetchAgreementSucceeded,
    watchRefetchLineup,
    watchAgreementBadge,
    watchAgreementPageMakePublic,
    watchGoToRemixesOfParentPage
  ]
}
