import { useCallback } from 'react'

import {
  getNotificationEntities,
  getNotificationUser
} from '@coliving/web/src/common/store/notifications/selectors'
import type {
  EntityType,
  RemixCreate,
  DigitalContentEntity
} from '@coliving/web/src/common/store/notifications/types'

import IconRemix from 'app/assets/images/iconRemix.svg'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'
import { EventNames } from 'app/types/analytics'
import { make } from 'app/utils/analytics'
import { getDigitalContentRoute } from 'app/utils/routes'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  NotificationTwitterButton
} from '../notification'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'New Remix of Your DigitalContent',
  by: 'by',
  shareTwitterText: (digitalContentTitle: string, handle: string) =>
    `New remix of ${digitalContentTitle} by ${handle} on @dgc-network #Coliving`
}

type RemixCreateNotificationProps = {
  notification: RemixCreate
}

export const RemixCreateNotification = (
  props: RemixCreateNotificationProps
) => {
  const { notification } = props
  const { childDigitalContentId, parentDigitalContentId } = notification
  const navigation = useDrawerNavigation()
  const user = useSelectorWeb((state) =>
    getNotificationUser(state, notification)
  )
  const digitalContents = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  ) as EntityType[]

  const childDigitalContent = digitalContents?.find(
    (digital_content): digital_content is DigitalContentEntity =>
      'digital_content_id' in digital_content && digital_content.digital_content_id === childDigitalContentId
  )

  const parentDigitalContent = digitalContents?.find(
    (digital_content): digital_content is DigitalContentEntity =>
      'digital_content_id' in digital_content && digital_content.digital_content_id === parentDigitalContentId
  )
  const parentDigitalContentTitle = parentDigitalContent?.title

  const handlePress = useCallback(() => {
    if (childDigitalContent) {
      navigation.navigate({
        native: {
          screen: 'DigitalContent',
          params: { id: childDigitalContent.digital_content_id, fromNotifications: true }
        },
        web: {
          route: getDigitalContentRoute(childDigitalContent)
        }
      })
    }
  }, [childDigitalContent, navigation])

  const handleTwitterShareData = useCallback(
    (handle: string | undefined) => {
      if (parentDigitalContentTitle && handle) {
        const shareText = messages.shareTwitterText(parentDigitalContentTitle, handle)
        const analytics = make({
          eventName: EventNames.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE,
          text: shareText
        })
        return { shareText, analytics }
      }
      return null
    },
    [parentDigitalContentTitle]
  )

  if (!user || !childDigitalContent || !parentDigitalContent) return null

  const twitterUrl = getDigitalContentRoute(parentDigitalContent, true)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconRemix}>
        <NotificationTitle>
          {messages.title} <EntityLink entity={parentDigitalContent} />
        </NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <EntityLink entity={childDigitalContent} /> {messages.by}{' '}
        <UserNameLink user={user} />
      </NotificationText>
      <NotificationTwitterButton
        type='dynamic'
        url={twitterUrl}
        handle={user.handle}
        shareData={handleTwitterShareData}
      />
    </NotificationTile>
  )
}
