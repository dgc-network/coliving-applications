import { memo } from 'react'

import { SquareSizes } from '@coliving/common'
import { Button, ButtonType, IconArrow } from '@coliving/stems'

import DynamicImage from 'components/dynamicImage/dynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'

import styles from './LandlordProfile.module.css'

const LandlordProfile = (props) => {
  const profilePicture = useUserProfilePicture(
    props.userId,
    props.profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )
  return (
    <div className={styles.landlordProfileContainer}>
      <div className={styles.landlordLeftContainer}>
        <DynamicImage
          wrapperClassName={styles.landlordProfilePictureWrapper}
          className={styles.landlordProfilePicture}
          image={profilePicture}
        />
        <div className={styles.landlordNameContainer}>
          <div className={styles.landlordName}>
            <span>{props.name}</span>
            <UserBadges
              userId={props.userId}
              badgeSize={20}
              className={styles.iconVerified}
            />
          </div>
          <span className={styles.landlordHandle}>{`@${props.handle}`}</span>
        </div>
      </div>
      <div>
        <Button
          text='View Profile'
          onClick={props.onViewProfile}
          type={ButtonType.COMMON}
          rightIcon={<IconArrow />}
          className={styles.landlordProfileButton}
          textClassName={styles.landlordProfileButtonText}
        />
      </div>
    </div>
  )
}

export default memo(LandlordProfile)
