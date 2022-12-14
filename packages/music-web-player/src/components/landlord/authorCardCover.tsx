import { useCallback } from 'react'

import { SquareSizes, WidthSizes, User } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { ReactComponent as BadgeLandlord } from 'assets/img/badgeLandlord.svg'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import FollowsYouBadge from 'components/userBadges/followsYouBadge'
import UserBadges from 'components/userBadges/userBadges'
import { useUserCoverPhoto } from 'hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { profilePage } from 'utils/route'

import styles from './LandlordCardCover.module.css'

const gradient = `linear-gradient(180deg, rgba(0, 0, 0, 0.001) 0%, rgba(0, 0, 0, 0.005) 67.71%, rgba(0, 0, 0, 0.15) 79.17%, rgba(0, 0, 0, 0.25) 100%)`

type LandlordCoverProps = {
  author: User
  isLandlord: boolean
  onNavigateAway?: () => void
}

export const LandlordCardCover = (props: LandlordCoverProps) => {
  const { isLandlord, author, onNavigateAway } = props

  const {
    user_id,
    name,
    handle,
    _cover_photo_sizes,
    _profile_picture_sizes,
    does_follow_current_user
  } = author
  const dispatch = useDispatch()

  const coverPhoto = useUserCoverPhoto(
    user_id,
    _cover_photo_sizes,
    WidthSizes.SIZE_640
  )
  const profilePicture = useUserProfilePicture(
    user_id,
    _profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  const darkenedCoverPhoto = `${gradient}, url(${coverPhoto})`

  const handleClickUser = useCallback(() => {
    if (onNavigateAway) {
      onNavigateAway()
    }
    dispatch(push(profilePage(handle)))
  }, [dispatch, handle, onNavigateAway])

  return (
    <DynamicImage
      wrapperClassName={styles.landlordCoverPhoto}
      image={darkenedCoverPhoto}
      immediate
    >
      <div className={styles.coverPhotoContentContainer}>
        {isLandlord ? <BadgeLandlord className={styles.badgeLandlord} /> : null}
        <DynamicImage
          wrapperClassName={styles.profilePictureWrapper}
          skeletonClassName={styles.profilePictureSkeleton}
          className={styles.profilePicture}
          image={profilePicture}
          immediate
        />
        <div className={styles.headerTextContainer}>
          <div className={styles.nameContainer}>
            <div className={styles.landlordName} onClick={handleClickUser}>
              {name}
            </div>
            <UserBadges
              userId={user_id}
              badgeSize={14}
              className={styles.iconVerified}
              useSVGTiers
            />
          </div>
          <div className={styles.landlordHandleWrapper}>
            <div
              className={styles.landlordHandle}
              onClick={handleClickUser}
            >{`@${handle}`}</div>
            {does_follow_current_user ? <FollowsYouBadge /> : null}
          </div>
        </div>
      </div>
    </DynamicImage>
  )
}
