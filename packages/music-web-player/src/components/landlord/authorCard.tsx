import { MouseEventHandler, useCallback, useMemo } from 'react'

import { FollowSource, User, FeatureFlags } from '@coliving/common'
import { useDispatch } from 'react-redux'

import { setNotificationSubscription } from 'common/store/pages/profile/actions'
import { followUser, unfollowUser } from 'common/store/social/users/actions'
import FollowButton from 'components/followButton/followButton'
import Stats, { StatProps } from 'components/stats/stats'
import { getFeatureEnabled } from 'services/remoteConfig/featureFlagHelpers'

import styles from './LandlordCard.module.css'
import { LandlordCardCover } from './authorCardCover'
import { LandlordSupporting } from './authorSupporting'

type LandlordCardProps = {
  author: User
  onNavigateAway: () => void
}

export const LandlordCard = (props: LandlordCardProps) => {
  const { author, onNavigateAway } = props
  const {
    user_id,
    bio,
    digital_content_count,
    content_list_count,
    follower_count,
    followee_count,
    does_current_user_follow
  } = author

  const dispatch = useDispatch()
  const isLandlord = digital_content_count > 0
  const isTippingEnabled = getFeatureEnabled(FeatureFlags.TIPPING_ENABLED)

  const handleClick: MouseEventHandler = useCallback((event) => {
    event.stopPropagation()
  }, [])

  const stats = useMemo((): StatProps[] => {
    if (isLandlord) {
      return [
        {
          number: digital_content_count,
          title: digital_content_count === 1 ? 'digital_content' : 'digitalContents',
          key: 'digital_content'
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
  }, [isLandlord, digital_content_count, follower_count, followee_count, content_list_count])

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
          author={author}
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
                author={author}
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
