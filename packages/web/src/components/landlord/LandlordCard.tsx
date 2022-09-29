import { MouseEventHandler, useCallback, useMemo } from 'react'

import { FollowSource, User, FeatureFlags } from '@coliving/common'
import { useDispatch } from 'react-redux'

import { setNotificationSubscription } from 'common/store/pages/profile/actions'
import { followUser, unfollowUser } from 'common/store/social/users/actions'
import FollowButton from 'components/followButton/followButton'
import Stats, { StatProps } from 'components/stats/stats'
import { getFeatureEnabled } from 'services/remoteConfig/featureFlagHelpers'

import styles from './LandlordCard.module.css'
import { LandlordCardCover } from './landlordCardCover'
import { LandlordSupporting } from './landlordSupporting'

type LandlordCardProps = {
  landlord: User
  onNavigateAway: () => void
}

export const LandlordCard = (props: LandlordCardProps) => {
  const { landlord, onNavigateAway } = props
  const {
    user_id,
    bio,
    agreement_count,
    content_list_count,
    follower_count,
    followee_count,
    does_current_user_follow
  } = landlord

  const dispatch = useDispatch()
  const isLandlord = agreement_count > 0
  const isTippingEnabled = getFeatureEnabled(FeatureFlags.TIPPING_ENABLED)

  const handleClick: MouseEventHandler = useCallback((event) => {
    event.stopPropagation()
  }, [])

  const stats = useMemo((): StatProps[] => {
    if (isLandlord) {
      return [
        {
          number: agreement_count,
          title: agreement_count === 1 ? 'agreement' : 'agreements',
          key: 'agreement'
        },
        {
          number: follower_count,
          title: follower_count === 1 ? 'follower' : 'followers',
          key: 'follower'
        },
        { number: followee_count, title: 'following', key: 'following' }
      ]
    }
    return [
      {
        number: content_list_count,
        title: content_list_count === 1 ? 'contentList' : 'contentLists',
        key: 'contentList'
      },
      {
        number: follower_count,
        title: follower_count === 1 ? 'follower' : 'followers',
        key: 'follower'
      },
      { number: followee_count, title: 'following', key: 'following' }
    ]
  }, [isLandlord, agreement_count, follower_count, followee_count, content_list_count])

  const handleFollow = useCallback(() => {
    dispatch(followUser(user_id, FollowSource.HOVER_TILE))
  }, [dispatch, user_id])

  const handleUnfollow = useCallback(() => {
    dispatch(unfollowUser(user_id, FollowSource.HOVER_TILE))
    dispatch(setNotificationSubscription(user_id, false, true))
  }, [dispatch, user_id])

  return (
    <div className={styles.popoverContainer} onClick={handleClick}>
      <div className={styles.landlordCardContainer}>
        <LandlordCardCover
          landlord={landlord}
          isLandlord={isLandlord}
          onNavigateAway={onNavigateAway}
        />
        <div className={styles.landlordStatsContainer}>
          <Stats
            userId={user_id}
            stats={stats}
            clickable={false}
            size='medium'
          />
        </div>
        <div className={styles.contentContainer}>
          <div>
            {isTippingEnabled ? (
              <LandlordSupporting
                landlord={landlord}
                onNavigateAway={onNavigateAway}
              />
            ) : null}
            <div className={styles.description}>{bio}</div>
            <FollowButton
              className={styles.followButton}
              following={does_current_user_follow}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              stopPropagation
            />
          </div>
        </div>
      </div>
    </div>
  )
}
