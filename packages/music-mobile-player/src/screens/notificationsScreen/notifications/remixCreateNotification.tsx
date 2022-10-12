import { useCallback } from 'react'

import {
  getNotificationEntities,
  getNotificationUser
} from '@coliving/web/src/common/store/notifications/selectors'
import type {
  EntityType,
  RemixCreate,
  AgreementEntity
} from '@coliving/web/src/common/store/notifications/types'

import IconRemix from 'app/assets/images/iconRemix.svg'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'
import { EventNames } from 'app/types/analytics'
import { make } from 'app/utils/analytics'
import { getAgreementRoute } from 'app/utils/routes'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  NotificationTwitterButton
} from '../Notification'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'New Remix of Your DigitalContent',
  by: 'by',
  shareTwitterText: (agreementTitle: string, handle: string) =>
    `New remix of ${agreementTitle} by ${handle} on @dgc-network #Coliving`
}

type RemixCreateNotificationProps = {
  notification: RemixCreate
}

export const RemixCreateNotification = (
  props: RemixCreateNotificationProps
) => {
  const { notification } = props
  const { childAgreementId, parentAgreementId } = notification
  const navigation = useDrawerNavigation()
  const user = useSelectorWeb((state) =>
    getNotificationUser(state, notification)
  )
  const agreements = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  ) as EntityType[]

  const childAgreement = agreements?.find(
    (digital_content): digital_content is AgreementEntity =>
      'digital_content_id' in digital_content && digital_content.digital_content_id === childAgreementId
  )

  const parentAgreement = agreements?.find(
    (digital_content): digital_content is AgreementEntity =>
      'digital_content_id' in digital_content && digital_content.digital_content_id === parentAgreementId
  )
  const parentAgreementTitle = parentAgreement?.title

  const handlePress = useCallback(() => {
    if (childAgreement) {
      navigation.navigate({
        native: {
          screen: 'DigitalContent',
          params: { id: childAgreement.digital_content_id, fromNotifications: true }
        },
        web: {
          route: getAgreementRoute(childAgreement)
        }
      })
    }
  }, [childAgreement, navigation])

  const handleTwitterShareData = useCallback(
    (handle: string | undefined) => {
      if (parentAgreementTitle && handle) {
        const shareText = messages.shareTwitterText(parentAgreementTitle, handle)
        const analytics = make({
          eventName: EventNames.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE,
          text: shareText
        })
        return { shareText, analytics }
      }
      return null
    },
    [parentAgreementTitle]
  )

  if (!user || !childAgreement || !parentAgreement) return null

  const twitterUrl = getAgreementRoute(parentAgreement, true)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconRemix}>
        <NotificationTitle>
          {messages.title} <EntityLink entity={parentAgreement} />
        </NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <EntityLink entity={childAgreement} /> {messages.by}{' '}
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
