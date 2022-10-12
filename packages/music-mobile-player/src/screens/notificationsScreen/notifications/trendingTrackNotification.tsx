import { useCallback } from 'react'

import type { Nullable } from '@coliving/common'
import { getNotificationEntity } from '@coliving/web/src/common/store/notifications/selectors'
import type {
  AgreementEntity,
  TrendingAgreement
} from '@coliving/web/src/common/store/notifications/types'

import IconTrending from 'app/assets/images/iconTrending.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getAgreementRoute } from 'app/utils/routes'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle
} from '../Notification'
import { useDrawerNavigation } from '../useDrawerNavigation'

const getRankSuffix = (rank: number) => {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

const messages = {
  title: 'Trending on Coliving!',
  your: 'Your digital_content',
  is: 'is',
  trending: 'on Trending right now!'
}

type TrendingAgreementNotificationProps = {
  notification: TrendingAgreement
}

export const TrendingAgreementNotification = (
  props: TrendingAgreementNotificationProps
) => {
  const { notification } = props
  const { rank } = notification
  const rankSuffix = getRankSuffix(rank)
  const digital_content = useSelectorWeb(
    (state) => getNotificationEntity(state, notification),
    isEqual
  ) as Nullable<AgreementEntity>
  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    if (digital_content) {
      navigation.navigate({
        native: { screen: 'DigitalContent', params: { id: digital_content.digital_content_id } },
        web: { route: getAgreementRoute(digital_content) }
      })
    }
  }, [navigation, digital_content])

  if (!digital_content) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrending}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.your} <EntityLink entity={digital_content} /> {messages.is} {rank}
        {rankSuffix} {messages.trending}
      </NotificationText>
    </NotificationTile>
  )
}
