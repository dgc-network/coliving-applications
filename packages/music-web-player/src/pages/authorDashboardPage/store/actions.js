export const FETCH_DASHBOARD = 'DASHBOARD/FETCH_DASHBOARD'
export const FETCH_DASHBOARD_SUCCEEDED = 'DASHBOARD/FETCH_DASHBOARD_SUCCEEDED'
export const FETCH_DASHBOARD_FAILED = 'DASHBOARD/FETCH_DASHBOARD_FAILED'

export const FETCH_DASHBOARD_LISTEN_DATA =
  'DASHBOARD/FETCH_DASHBOARD_LISTEN_DATA'
export const FETCH_DASHBOARD_LISTEN_DATA_SUCCEEDED =
  'DASHBOARD/FETCH_DASHBOARD_LISTEN_DATA_SUCCEEDED'
export const FETCH_DASHBOARD_LISTEN_DATA_FAILED =
  'DASHBOARD/FETCH_DASHBOARD_LISTEN_DATA_FAILED'

export const RESET_DASHBOARD = 'DASHBOARD/RESET_DASHBOARD'

export function fetchDashboard() {
  return { type: FETCH_DASHBOARD }
}

export function fetchDashboardSucceeded(digitalContents, collections, unlistedDigitalContents) {
  return {
    type: FETCH_DASHBOARD_SUCCEEDED,
    digitalContents,
    collections,
    unlistedDigitalContents
  }
}

export function fetchDashboardFailed() {
  return { type: FETCH_DASHBOARD_FAILED }
}

export function fetchDashboardListenData(
  digitalContentIds,
  start,
  end,
  period = 'month'
) {
  return { type: FETCH_DASHBOARD_LISTEN_DATA, digitalContentIds, start, end, period }
}

export function fetchDashboardListenDataSucceeded(listenData) {
  return { type: FETCH_DASHBOARD_LISTEN_DATA_SUCCEEDED, listenData }
}

export function fetchDashboardListenDataFailed() {
  return { type: FETCH_DASHBOARD_LISTEN_DATA_FAILED }
}

export function resetDashboard() {
  return { type: RESET_DASHBOARD }
}
