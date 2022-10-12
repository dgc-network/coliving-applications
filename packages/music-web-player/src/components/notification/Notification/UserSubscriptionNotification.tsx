import { useCallback } from 'react'

import { Name } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import {
  getNotificationEntities,
  getNotificationUser
} from 'common/store/notifications/selectors'
import { Entity, UserSubscription } from 'common/store/notifications/types'
import { make, useRecord } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'
import { profilePage } from 'utils/route'

import styles from './UserSubscriptionNotification.module.css'
import { EntityLink } from './components/entityLink'
import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { ProfilePicture } from './components/profilePicture'
import { UserNameLink } from './components/userNameLink'
import { IconRelease } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'New Release',
  posted: 'posted',
  new: 'new'
}

type UserSubscriptionNotificationProps = {
  notification: UserSubscription
}

export const UserSubscriptionNotification = (
  props: UserSubscriptionNotificationProps
) => {
  const { notification } = props
  const { entityType, entityIds, timeLabel, isViewed, type } = notification
  const user = useSelector((state) => getNotificationUser(state, notification))
  const entities = useSelector((state) =>
    getNotificationEntities(state, notification)
  )
  const uploadCount = entityIds.length
  const isSingleUpload = uploadCount === 1

  const dispatch = useDispatch()
  const record = useRecord()

  const handleClick = useCallback(() => {
    if (entityType === Entity.DigitalContent && !isSingleUpload) {
      if (user) {
        dispatch(push(profilePage(user.handle)))
      }
    } else {
      if (entities) {
        const entityLink = getEntityLink(entities[0])
        dispatch(push(entityLink))
        record(
          make(Name.NOTIFICATIONS_CLICK_TILE, {
            kind: type,
            link_to: entityLink
          })
        )
      }
    }
  }, [entityType, isSingleUpload, user, entities, dispatch, record, type])

  if (!user || !entities) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRelease />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <div className={styles.body}>
          <ProfilePicture className={styles.profilePicture} user={user} />
          <span>
            <UserNameLink user={user} notification={notification} />{' '}
            {messages.posted} {isSingleUpload ? 'a' : uploadCount}{' '}
            {messages.new} {entityType.toLowerCase()}
            {isSingleUpload ? '' : 's'}{' '}
            {isSingleUpload ? (
              <EntityLink entity={entities[0]} entityType={entityType} />
            ) : null}
          </span>
        </div>
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
