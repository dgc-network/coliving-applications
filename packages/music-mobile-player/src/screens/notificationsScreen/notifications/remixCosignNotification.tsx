import { useCallback } from 'react'

import type { Nullable } from '@coliving/common'
import {
  getNotificationEntities,
  getNotificationUser
} from '@coliving/web/src/common/store/notifications/selectors'
import type {
  RemixCosign,
  DigitalContentEntity
} from '@coliving/web/src/common/store/notifications/types'
import { View } from 'react-native'

import IconRemix from 'app/assets/images/iconRemix.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
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
  ProfilePicture,
  NotificationTwitterButton
} from '../notification'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of',
  shareTwitterText: (digitalContentTitle: string, handle: string) =>
    `My remix of ${digitalContentTitle} was Co-Signed by ${handle} on @dgc-network #Coliving`
}

type RemixCosignNotificationProps = {
  notification: RemixCosign
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
) => {
  const { notification } = props
  const navigation = useDrawerNavigation()
  const { childDigitalContentId, parentDigitalContentUserId } = notification
  const user = useSelectorWeb((state) =>
    getNotificationUser(state, notification)
  )
  // TODO: casting from EntityType to DigitalContentEntity here, but
  // getNotificationEntities should be smart enough based on notif type
  const digitalContents = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  ) as Nullable<DigitalContentEntity[]>

  const childDigitalContent = digitalContents?.find(({ digital_content_id }) => digital_content_id === childDigitalContentId)
  const parentDigitalContent = digitalContents?.find(
    ({ owner_id }) => owner_id === parentDigitalContentUserId
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

  const twitterUrl = getDigitalContentRoute(childDigitalContent, true)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconRemix}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={user} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={user} /> {messages.cosign}{' '}
            <EntityLink entity={parentDigitalContent} />
          </NotificationText>
        </View>
      </View>
      <NotificationTwitterButton
        type='dynamic'
        url={twitterUrl}
        handle={user.handle}
        shareData={handleTwitterShareData}
      />
    </NotificationTile>
  )
}
