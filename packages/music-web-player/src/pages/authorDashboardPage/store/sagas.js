import { IntKeys } from '@coliving/common'
import { each } from 'lodash'
import moment from 'moment'
import { all, call, put, take, takeEvery } from 'redux-saga/effects'

import { getAccountUser } from 'common/store/account/selectors'
import { retrieveUserDigitalContents } from 'common/store/pages/profile/lineups/digital_contents/retrieveUserDigitalContents'
import { getBalance } from 'common/store/wallet/slice'
import ColivingBackend from 'services/colivingBackend'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'
import { waitForBackendSetup } from 'store/backend/sagas'
import { DASHBOARD_PAGE } from 'utils/route'
import { doEvery, requiresAccount, waitForValue } from 'utils/sagaHelpers'

import * as dashboardActions from './actions'

function* fetchDashboardAsync(action) {
  yield call(waitForBackendSetup)

  const account = yield call(waitForValue, getAccountUser)

  const [digitalContents, contentLists] = yield all([
    call(retrieveUserDigitalContents, {
      handle: account.handle,
      currentUserId: account.user_id,
      // TODO: This only supports up to 500, we need to redesign / paginate
      // the dashboard
      getUnlisted: true
    }),
    call(ColivingBackend.getContentLists, account.user_id, [])
  ])
  const listedDigitalContents = digitalContents.filter((t) => t.is_unlisted === false)
  const unlistedDigitalContents = digitalContents.filter((t) => t.is_unlisted === true)

  const digitalContentIds = listedDigitalContents.map((t) => t.digital_content_id)
  const now = moment()

  yield call(fetchDashboardListenDataAsync, {
    digitalContentIds,
    start: now.clone().subtract(1, 'years').toISOString(),
    end: now.toISOString(),
    period: 'month'
  })

  if (
    listedDigitalContents.length > 0 ||
    contentLists.length > 0 ||
    unlistedDigitalContents.length > 0
  ) {
    yield put(
      dashboardActions.fetchDashboardSucceeded(
        listedDigitalContents,
        contentLists,
        unlistedDigitalContents
      )
    )
    yield call(pollForBalance)
  } else {
    yield put(dashboardActions.fetchDashboardFailed())
  }
}

const formatMonth = (date) => moment.utc(date).format('MMM').toUpperCase()

function* fetchDashboardListenDataAsync(action) {
  const listenData = yield call(
    ColivingBackend.getDigitalContentListens,
    action.digitalContentIds,
    action.start,
    action.end,
    action.period
  )

  const labels = []
  const labelIndexMap = {}
  const startDate = moment.utc(action.start)
  const endDate = moment.utc(action.end)
  while (startDate.isBefore(endDate)) {
    startDate.add(1, 'month').endOf('month')
    const label = formatMonth(startDate)
    labelIndexMap[label] = labels.length
    labels.push(label)
  }

  const formattedListenData = {
    all: {
      labels: [...labels],
      values: new Array(labels.length).fill(0)
    }
  }
  each(listenData, (data, date) => {
    formattedListenData.all.values[labelIndexMap[formatMonth(date)]] =
      data.totalListens
    data.listenCounts.forEach((count) => {
      if (!(count.digitalContentId in formattedListenData)) {
        formattedListenData[count.digitalContentId] = {
          labels: [...labels],
          values: new Array(labels.length).fill(0)
        }
      }
      formattedListenData[count.digitalContentId].values[
        labelIndexMap[formatMonth(date)]
      ] = count.listens
    })
  })

  if (listenData) {
    yield put(
      dashboardActions.fetchDashboardListenDataSucceeded(formattedListenData)
    )
  } else {
    yield put(dashboardActions.fetchDashboardListenDataFailed())
  }
}

function* pollForBalance() {
  const pollingFreq = remoteConfigInstance.getRemoteVar(
    IntKeys.DASHBOARD_WALLET_BALANCE_POLLING_FREQ_MS
  )
  const chan = yield call(doEvery, pollingFreq, function* () {
    yield put(getBalance())
  })
  yield take(dashboardActions.RESET_DASHBOARD)
  chan.close()
}

function* watchFetchDashboard() {
  yield takeEvery(
    dashboardActions.FETCH_DASHBOARD,
    requiresAccount(fetchDashboardAsync, DASHBOARD_PAGE)
  )
}

function* watchFetchDashboardListenData() {
  yield takeEvery(
    dashboardActions.FETCH_DASHBOARD_LISTEN_DATA,
    fetchDashboardListenDataAsync
  )
}

export default function sagas() {
  return [watchFetchDashboard, watchFetchDashboardListenData]
}
