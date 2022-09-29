import {
  ID,
  CoverPhotoSizes,
  ProfilePictureSizes,
  SquareSizes,
  WidthSizes
} from '@coliving/common'

import { ReactComponent as BadgeLandlord } from 'assets/img/badgeLandlord.svg'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserCoverPhoto } from 'hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'

import styles from './LandlordCard.module.css'

const gradient = `linear-gradient(180deg, rgba(0, 0, 0, 0.001) 0%, rgba(0, 0, 0, 0.005) 67.71%, rgba(0, 0, 0, 0.15) 79.17%, rgba(0, 0, 0, 0.25) 100%)`

type LandlordCoverProps = {
  userId: ID
  name: string
  handle: string
  isLandlord: boolean
  doesFollowCurrentUser: boolean
  onNameClick: () => void
  coverPhotoSizes: CoverPhotoSizes
  profilePictureSizes: ProfilePictureSizes
}

export const LandlordCover = ({
  userId,
  name,
  handle,
  isLandlord,
  doesFollowCurrentUser,
  onNameClick,
  profilePictureSizes,
  coverPhotoSizes
}: LandlordCoverProps) => {
  const coverPhoto = useUserCoverPhoto(
    userId,
    coverPhotoSizes,
    WidthSizes.SIZE_640
  )
  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

  const darkenedCoverPhoto = `${gradient}, url(${coverPhoto})`

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
          className={styles.profilePicture}
          image={profilePicture}
          immediate
        />
        <div className={styles.headerTextContainer}>
          <div className={styles.nameContainer}>
            <div className={styles.landlordName} onClick={onNameClick}>
              {name}
            </div>
            <UserBadges
              userId={userId}
              badgeSize={14}
              className={styles.iconVerified}
              useSVGTiers
            />
          </div>
          <div className={styles.landlordHandleWrapper}>
            <div
              className={styles.landlordHandle}
              onClick={onNameClick}
            >{`@${handle}`}</div>
            {doesFollowCurrentUser ? <FollowsYouBadge /> : null}
          </div>
        </div>
      </div>
    </DynamicImage>
  )
}
