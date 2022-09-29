import { call, put, select, takeEvery } from 'typed-redux-saga/macro'

import { getHasAccount } from 'common/store/account/selectors'
import * as notificationActions from 'common/store/notifications/actions'
import ColivingBackend from 'services/colivingBackend'
import { ResetNotificationsBadgeCount } from 'services/nativeMobileInterface/notifications'
import { MessageType } from 'services/nativeMobileInterface/types'
import { waitForBackendSetup } from 'store/backend/sagas'

// Clear the notification badges if the user is signed in
function* resetNotificationBadgeCount() {
  try {
    const hasAccount = yield* select(getHasAccount)
    if (hasAccount) {
      const message = new ResetNotificationsBadgeCount()
      message.send()
      yield* call(ColivingBackend.clearNotificationBadges)
    }
  } catch (error) {
    console.error(error)
  }
}

// On Native App open and enter foreground, clear the notification badges
function* watchResetNotificationBadgeCount() {
  yield* call(waitForBackendSetup)
  yield* call(resetNotificationBadgeCount)
  yield* takeEvery(MessageType.ENTER_FOREGROUND, resetNotificationBadgeCount)
}

function* watchMarkAllNotificationsViewed() {
  yield* takeEvery(MessageType.MARK_ALL_NOTIFICATIONS_AS_VIEWED, function* () {
    yield* put(notificationActions.markAllAsViewed())
  })
}

const sagas = () => {
  return [watchResetNotificationBadgeCount, watchMarkAllNotificationsViewed]
}

export default sagas
