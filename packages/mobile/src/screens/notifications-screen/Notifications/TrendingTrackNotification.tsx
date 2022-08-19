import { useCallback } from 'react'

import type { Nullable } from '@/common'
import { getNotificationEntity } from '-client/src/common/store/notifications/selectors'
import type {
  AgreementEntity,
  TrendingAgreement
} from '-client/src/common/store/notifications/types'

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
  your: 'Your agreement',
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
  const agreement = useSelectorWeb(
    (state) => getNotificationEntity(state, notification),
    isEqual
  ) as Nullable<AgreementEntity>
  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    if (agreement) {
      navigation.navigate({
        native: { screen: 'Agreement', params: { id: agreement.agreement_id } },
        web: { route: getAgreementRoute(agreement) }
      })
    }
  }, [navigation, agreement])

  if (!agreement) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrending}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.your} <EntityLink entity={agreement} /> {messages.is} {rank}
        {rankSuffix} {messages.trending}
      </NotificationText>
    </NotificationTile>
  )
}
