import { useCallback } from 'react'

import { Name, Nullable } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { getNotificationEntity } from 'common/store/notifications/selectors'
import { DigitalContentEntity, TrendingDigitalContent } from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/entityLink'
import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { TwitterShareButton } from './components/twitterShareButton'
import { IconTrending } from './components/icons'
import { getRankSuffix, getEntityLink } from './utils'

const messages = {
  title: 'Trending on Coliving!',
  your: 'Your digital_content',
  is: 'is',
  trending: 'on Trending right now!',
  twitterShareText: (entityTitle: string, rank: number) =>
    `My digital_content ${entityTitle} is trending ${rank}${getRankSuffix(
      rank
    )} on @dgc-network! #ColivingTrending #Coliving`
}

type TrendingDigitalContentNotificationProps = {
  notification: TrendingDigitalContent
}

export const TrendingDigitalContentNotification = (
  props: TrendingDigitalContentNotificationProps
) => {
  const { notification } = props
  const { entityType, rank, timeLabel, isViewed } = notification
  const rankSuffix = getRankSuffix(rank)
  const dispatch = useDispatch()
  const digital_content = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<DigitalContentEntity>

  const handleClick = useCallback(() => {
    if (digital_content) {
      dispatch(push(getEntityLink(digital_content)))
    }
  }, [dispatch, digital_content])

  if (!digital_content) return null

  const shareText = messages.twitterShareText(digital_content.title, rank)

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrending />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.your} <EntityLink entity={digital_content} entityType={entityType} />{' '}
        {messages.is} {rank}
        {rankSuffix} {messages.trending}
      </NotificationBody>
      <TwitterShareButton
        type='static'
        url={getEntityLink(digital_content, true)}
        shareText={shareText}
        analytics={make(Name.NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE, {
          milestone: shareText
        })}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
