import { useCallback } from 'react'

import { Name, Nullable } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { getNotificationEntity } from 'common/store/notifications/selectors'
import { AgreementEntity, TrendingAgreement } from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { IconTrending } from './components/icons'
import { getRankSuffix, getEntityLink } from './utils'

const messages = {
  title: 'Trending on Coliving!',
  your: 'Your agreement',
  is: 'is',
  trending: 'on Trending right now!',
  twitterShareText: (entityTitle: string, rank: number) =>
    `My agreement ${entityTitle} is trending ${rank}${getRankSuffix(
      rank
    )} on @dgc.network! #ColivingTrending #Coliving`
}

type TrendingAgreementNotificationProps = {
  notification: TrendingAgreement
}

export const TrendingAgreementNotification = (
  props: TrendingAgreementNotificationProps
) => {
  const { notification } = props
  const { entityType, rank, timeLabel, isViewed } = notification
  const rankSuffix = getRankSuffix(rank)
  const dispatch = useDispatch()
  const agreement = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<AgreementEntity>

  const handleClick = useCallback(() => {
    if (agreement) {
      dispatch(push(getEntityLink(agreement)))
    }
  }, [dispatch, agreement])

  if (!agreement) return null

  const shareText = messages.twitterShareText(agreement.title, rank)

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrending />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.your} <EntityLink entity={agreement} entityType={entityType} />{' '}
        {messages.is} {rank}
        {rankSuffix} {messages.trending}
      </NotificationBody>
      <TwitterShareButton
        type='static'
        url={getEntityLink(agreement, true)}
        shareText={shareText}
        analytics={make(Name.NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE, {
          milestone: shareText
        })}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
