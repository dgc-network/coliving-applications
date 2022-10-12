import { useCallback } from 'react'

import type { Nullable } from '@coliving/common'
import { getNotificationEntity } from '@coliving/web/src/common/store/notifications/selectors'
import type {
  DigitalContentEntity,
  TrendingDigitalContent
} from '@coliving/web/src/common/store/notifications/types'

import IconTrending from 'app/assets/images/iconTrending.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getDigitalContentRoute } from 'app/utils/routes'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle
} from '../notification'
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

type TrendingDigitalContentNotificationProps = {
  notification: TrendingDigitalContent
}

export const TrendingDigitalContentNotification = (
  props: TrendingDigitalContentNotificationProps
) => {
  const { notification } = props
  const { rank } = notification
  const rankSuffix = getRankSuffix(rank)
  const digital_content = useSelectorWeb(
    (state) => getNotificationEntity(state, notification),
    isEqual
  ) as Nullable<DigitalContentEntity>
  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    if (digital_content) {
      navigation.navigate({
        native: { screen: 'DigitalContent', params: { id: digital_content.digital_content_id } },
        web: { route: getDigitalContentRoute(digital_content) }
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
