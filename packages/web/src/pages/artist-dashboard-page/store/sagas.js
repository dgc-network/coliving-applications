import { IntKeys } from '@coliving/common'
import { each } from 'lodash'
import moment from 'moment'
import { all, call, put, take, takeEvery } from 'redux-saga/effects'

import { getAccountUser } from 'common/store/account/selectors'
import { retrieveUserAgreements } from 'common/store/pages/profile/lineups/agreements/retrieveUserAgreements'
import { getBalance } from 'common/store/wallet/slice'
import ColivingBackend from 'services/ColivingBackend'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { waitForBackendSetup } from 'store/backend/sagas'
import { DASHBOARD_PAGE } from 'utils/route'
import { doEvery, requiresAccount, waitForValue } from 'utils/sagaHelpers'

import * as dashboardActions from './actions'

function* fetchDashboardAsync(action) {
  yield call(waitForBackendSetup)

  const account = yield call(waitForValue, getAccountUser)

  const [agreements, content lists] = yield all([
    call(retrieveUserAgreements, {
      handle: account.handle,
      currentUserId: account.user_id,
      // TODO: This only supports up to 500, we need to redesign / paginate
      // the dashboard
      getUnlisted: true
    }),
    call(ColivingBackend.getPlaylists, account.user_id, [])
  ])
  const listedAgreements = agreements.filter((t) => t.is_unlisted === false)
  const unlistedAgreements = agreements.filter((t) => t.is_unlisted === true)

  const agreementIds = listedAgreements.map((t) => t.agreement_id)
  const now = moment()

  yield call(fetchDashboardListenDataAsync, {
    agreementIds,
    start: now.clone().subtract(1, 'years').toISOString(),
    end: now.toISOString(),
    period: 'month'
  })

  if (
    listedAgreements.length > 0 ||
    content lists.length > 0 ||
    unlistedAgreements.length > 0
  ) {
    yield put(
      dashboardActions.fetchDashboardSucceeded(
        listedAgreements,
        content lists,
        unlistedAgreements
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
    ColivingBackend.getAgreementListens,
    action.agreementIds,
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
      if (!(count.agreementId in formattedListenData)) {
        formattedListenData[count.agreementId] = {
          labels: [...labels],
          values: new Array(labels.length).fill(0)
        }
      }
      formattedListenData[count.agreementId].values[
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
