import { ID, Remix } from '@coliving/common'

import { LandlordPopover } from 'components/landlord/LandlordPopover'
import CoSign from 'components/coSign/coSign'
import { Size } from 'components/coSign/types'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import UserBadges from 'components/user-badges/UserBadges'

import styles from './RemixCard.module.css'

const messages = {
  by: 'By '
}

type RemixCardProps = {
  profilePictureImage: string
  coverArtImage: string
  coSign?: Remix | null
  landlordName: string
  landlordHandle: string
  onClick: () => void
  onClickLandlordName: () => void
  userId: ID
}

const RemixCard = ({
  profilePictureImage,
  coverArtImage,
  coSign,
  landlordName,
  landlordHandle,
  onClick,
  onClickLandlordName,
  userId
}: RemixCardProps) => {
  const images = (
    <div className={styles.images}>
      <div className={styles.profilePicture}>
        <DynamicImage image={profilePictureImage} />
      </div>
      <div className={styles.coverArt}>
        <DynamicImage image={coverArtImage} />
      </div>
    </div>
  )
  return (
    <div className={styles.remixCard}>
      <div className={styles.imagesContainer} onClick={onClick}>
        {coSign ? (
          <CoSign
            size={Size.MEDIUM}
            coSignName={coSign.user.name}
            hasFavorited={coSign.has_remix_author_saved}
            hasReposted={coSign.has_remix_author_reposted}
            userId={coSign.user?.user_id ?? 0}
          >
            {images}
          </CoSign>
        ) : (
          images
        )}
      </div>
      <div className={styles.landlord} onClick={onClickLandlordName}>
        <LandlordPopover handle={landlordHandle}>
          <div className={styles.name}>
            <div className={styles.by}>{messages.by}</div>
            <div className={styles.hoverable}>{landlordName}</div>
            <UserBadges
              className={styles.badges}
              userId={userId}
              badgeSize={12}
              inline
            />
          </div>
        </LandlordPopover>
      </div>
    </div>
  )
}

export default RemixCard
