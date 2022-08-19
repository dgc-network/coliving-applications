import { useCallback } from 'react'

import { Name, Agreement } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { getNotificationEntities } from 'common/store/notifications/selectors'
import {
  AddAgreementToPlaylist,
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
import { IconAddAgreementToPlaylist } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'Agreement Added to Playlist',
  shareTwitterText: (
    handle: string,
    agreement: Agreement,
    playlist: CollectionEntity
  ) =>
    `My agreement ${agreement.title} was added to the playlist ${playlist.playlist_name} by ${handle} on @colivingproject! #Coliving`
}

type AddAgreementToPlaylistNotificationProps = {
  notification: AddAgreementToPlaylist
}

export const AddAgreementToPlaylistNotification = (
  props: AddAgreementToPlaylistNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const { agreement, playlist } = useSelector((state) =>
    getNotificationEntities(state, notification)
  )
  const playlistOwner = playlist.user

  const dispatch = useDispatch()

  const handleTwitterShare = useCallback(
    (twitterHandle: string) => {
      if (agreement && playlist && twitterHandle) {
        const shareText = messages.shareTwitterText(
          twitterHandle,
          agreement,
          playlist
        )
        const analytics = make(
          Name.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE,
          { text: shareText }
        )
        return { shareText, analytics }
      }
      return null
    },
    [agreement, playlist]
  )

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(playlist)))
  }, [playlist, dispatch])

  if (!playlistOwner || !agreement) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconAddAgreementToPlaylist />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture
          className={styles.profilePicture}
          user={playlistOwner}
        />
        <span>
          <UserNameLink user={playlistOwner} notification={notification} />
          {' added your agreement '}
          <EntityLink entity={agreement} entityType={Entity.Agreement} />
          {' to their playlist '}
          <EntityLink entity={playlist} entityType={Entity.Playlist} />
        </span>
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={playlistOwner.handle}
        shareData={handleTwitterShare}
        url={getEntityLink(playlist, true)}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
