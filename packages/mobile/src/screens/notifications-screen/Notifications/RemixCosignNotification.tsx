import { useCallback } from 'react'

import type { Nullable } from '@coliving/common'
import {
  getNotificationEntities,
  getNotificationUser
} from '@coliving/web/src/common/store/notifications/selectors'
import type {
  RemixCosign,
  AgreementEntity
} from '@coliving/web/src/common/store/notifications/types'
import { View } from 'react-native'

import IconRemix from 'app/assets/images/iconRemix.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
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
  ProfilePicture,
  NotificationTwitterButton
} from '../Notification'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of',
  shareTwitterText: (agreementTitle: string, handle: string) =>
    `My remix of ${agreementTitle} was Co-Signed by ${handle} on @dgc-network #Coliving`
}

type RemixCosignNotificationProps = {
  notification: RemixCosign
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
) => {
  const { notification } = props
  const navigation = useDrawerNavigation()
  const { childAgreementId, parentAgreementUserId } = notification
  const user = useSelectorWeb((state) =>
    getNotificationUser(state, notification)
  )
  // TODO: casting from EntityType to AgreementEntity here, but
  // getNotificationEntities should be smart enough based on notif type
  const agreements = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  ) as Nullable<AgreementEntity[]>

  const childAgreement = agreements?.find(({ agreement_id }) => agreement_id === childAgreementId)
  const parentAgreement = agreements?.find(
    ({ owner_id }) => owner_id === parentAgreementUserId
  )
  const parentAgreementTitle = parentAgreement?.title

  const handlePress = useCallback(() => {
    if (childAgreement) {
      navigation.navigate({
        native: {
          screen: 'Agreement',
          params: { id: childAgreement.agreement_id, fromNotifications: true }
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

  const twitterUrl = getAgreementRoute(childAgreement, true)

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
            <EntityLink entity={parentAgreement} />
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
