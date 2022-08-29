import { useCallback } from 'react'

import { Name, Agreement } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { getNotificationEntities } from 'common/store/notifications/selectors'
import {
  AddAgreementToContentList,
  CollectionEntity,
  Entity
} from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import styles from './TipSentNotification.module.css'
import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconAddAgreementToContentList } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'Agreement Added to ContentList',
  shareTwitterText: (
    handle: string,
    agreement: Agreement,
    contentList: CollectionEntity
  ) =>
    `My agreement ${agreement.title} was added to the contentList ${contentList.content_list_name} by ${handle} on @colivingproject! #Coliving`
}

type AddAgreementToContentListNotificationProps = {
  notification: AddAgreementToContentList
}

export const AddAgreementToContentListNotification = (
  props: AddAgreementToContentListNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const { agreement, contentList } = useSelector((state) =>
    getNotificationEntities(state, notification)
  )
  const contentListOwner = contentList.user

  const dispatch = useDispatch()

  const handleTwitterShare = useCallback(
    (twitterHandle: string) => {
      if (agreement && contentList && twitterHandle) {
        const shareText = messages.shareTwitterText(
          twitterHandle,
          agreement,
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
    [agreement, contentList]
  )

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(contentList)))
  }, [contentList, dispatch])

  if (!contentListOwner || !agreement) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconAddAgreementToContentList />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture
          className={styles.profilePicture}
          user={contentListOwner}
        />
        <span>
          <UserNameLink user={contentListOwner} notification={notification} />
          {' added your agreement '}
          <EntityLink entity={agreement} entityType={Entity.Agreement} />
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
