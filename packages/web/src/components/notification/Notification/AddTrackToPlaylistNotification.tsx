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
    content list: CollectionEntity
  ) =>
    `My agreement ${agreement.title} was added to the content list ${content list.content list_name} by ${handle} on @colivingproject! #Coliving`
}

type AddAgreementToContentListNotificationProps = {
  notification: AddAgreementToContentList
}

export const AddAgreementToContentListNotification = (
  props: AddAgreementToContentListNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const { agreement, content list } = useSelector((state) =>
    getNotificationEntities(state, notification)
  )
  const content listOwner = content list.user

  const dispatch = useDispatch()

  const handleTwitterShare = useCallback(
    (twitterHandle: string) => {
      if (agreement && content list && twitterHandle) {
        const shareText = messages.shareTwitterText(
          twitterHandle,
          agreement,
          content list
        )
        const analytics = make(
          Name.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE,
          { text: shareText }
        )
        return { shareText, analytics }
      }
      return null
    },
    [agreement, content list]
  )

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(content list)))
  }, [content list, dispatch])

  if (!content listOwner || !agreement) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconAddAgreementToContentList />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture
          className={styles.profilePicture}
          user={content listOwner}
        />
        <span>
          <UserNameLink user={content listOwner} notification={notification} />
          {' added your agreement '}
          <EntityLink entity={agreement} entityType={Entity.Agreement} />
          {' to their content list '}
          <EntityLink entity={content list} entityType={Entity.ContentList} />
        </span>
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={content listOwner.handle}
        shareData={handleTwitterShare}
        url={getEntityLink(content list, true)}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
