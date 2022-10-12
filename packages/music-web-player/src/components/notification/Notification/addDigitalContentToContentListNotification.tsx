import { useCallback } from 'react'

import { Name, DigitalContent } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { getNotificationEntities } from 'common/store/notifications/selectors'
import {
  AddDigitalContentToContentList,
  CollectionEntity,
  Entity
} from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import styles from './tipSentNotification.module.css'
import { EntityLink } from './components/entityLink'
import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { ProfilePicture } from './components/profilePicture'
import { TwitterShareButton } from './components/twitterShareButton'
import { UserNameLink } from './components/userNameLink'
import { IconAddDigitalContentToContentList } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'DigitalContent Added to ContentList',
  shareTwitterText: (
    handle: string,
    digital_content: DigitalContent,
    contentList: CollectionEntity
  ) =>
    `My digital_content ${digital_content.title} was added to the contentList ${contentList.content_list_name} by ${handle} on @colivingproject! #Coliving`
}

type AddDigitalContentToContentListNotificationProps = {
  notification: AddDigitalContentToContentList
}

export const AddDigitalContentToContentListNotification = (
  props: AddDigitalContentToContentListNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const { digital_content, contentList } = useSelector((state) =>
    getNotificationEntities(state, notification)
  )
  const contentListOwner = contentList.user

  const dispatch = useDispatch()

  const handleTwitterShare = useCallback(
    (twitterHandle: string) => {
      if (digital_content && contentList && twitterHandle) {
        const shareText = messages.shareTwitterText(
          twitterHandle,
          digital_content,
          contentList
        )
        const analytics = make(
          Name.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE,
          { text: shareText }
        )
        return { shareText, analytics }
      }
      return null
    },
    [digital_content, contentList]
  )

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(contentList)))
  }, [contentList, dispatch])

  if (!contentListOwner || !digital_content) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconAddDigitalContentToContentList />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture
          className={styles.profilePicture}
          user={contentListOwner}
        />
        <span>
          <UserNameLink user={contentListOwner} notification={notification} />
          {' added your digital_content '}
          <EntityLink entity={digital_content} entityType={Entity.DigitalContent} />
          {' to their contentList '}
          <EntityLink entity={contentList} entityType={Entity.ContentList} />
        </span>
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={contentListOwner.handle}
        shareData={handleTwitterShare}
        url={getEntityLink(contentList, true)}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
