import { ReactNode } from 'react'

import {
  ID,
  ProfilePictureSizes,
  SquareSizes,
  CoverArtSizes
} from '@coliving/common'
import cn from 'classnames'

import placeholderArt from 'assets/img/imageBlank2x.png'
import { pluralize } from 'common/utils/formatUtil'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import RepostFavoritesStats, {
  Size
} from 'components/repost-favorites-stats/RepostFavoritesStats'
import UpdateDot from 'components/update-dot/UpdateDot'
import UserBadges from 'components/user-badges/UserBadges'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'

import styles from './Card.module.css'

const UserImage = (props: { id: ID; imageSize: ProfilePictureSizes }) => {
  const image = useUserProfilePicture(
    props.id,
    props.imageSize,
    SquareSizes.SIZE_480_BY_480
  )

  return (
    <DynamicImage
      wrapperClassName={cn(styles.coverArt, styles.userCardImage)}
      image={image}
    />
  )
}

const CollectionImage = (props: { id: ID; imageSize: CoverArtSizes }) => {
  const image = useCollectionCoverArt(
    props.id,
    props.imageSize,
    SquareSizes.SIZE_480_BY_480,
    placeholderArt
  )

  return <DynamicImage wrapperClassName={styles.coverArt} image={image} />
}

export const EmptyCard = () => <div className={styles.emptyCardContainer} />

type CardProps = {
  className?: string
  id: ID
  userId: ID
  imageSize: ProfilePictureSizes | CoverArtSizes | null
  primaryText: ReactNode
  secondaryText: ReactNode
  isUser?: boolean
  agreementCount?: number
  isPlaylist?: boolean
  // Socials
  reposts?: number
  favorites?: number
  onClickReposts?: () => void
  onClickFavorites?: () => void
  onClick: () => void
  updateDot?: boolean
}

const Card = ({
  className,
  id,
  userId,
  imageSize = null,
  isUser,
  primaryText,
  secondaryText,
  agreementCount,
  reposts,
  favorites,
  onClickReposts,
  onClickFavorites,
  onClick,
  updateDot
}: CardProps) => {
  const showRepostFavoriteStats =
    !isUser && reposts && favorites && onClickReposts && onClickFavorites
  return (
    <div
      className={cn(styles.cardContainer, {
        [className!]: !!className
      })}
      onClick={onClick}
    >
      {updateDot && <UpdateDot />}
      <div className={styles.tileCoverArtContainer}>
        {isUser ? (
          <UserImage id={id} imageSize={imageSize as ProfilePictureSizes} />
        ) : (
          <CollectionImage id={id} imageSize={imageSize as CoverArtSizes} />
        )}
      </div>
      <div className={styles.text}>
        <div className={styles.primaryText}>{primaryText}</div>
        <div className={styles.secondaryText}>
          {secondaryText}
          <UserBadges
            userId={userId}
            className={styles.iconVerified}
            badgeSize={12}
          />
        </div>
        {(showRepostFavoriteStats || agreementCount !== undefined) && (
          <div className={styles.menu}>
            {showRepostFavoriteStats ? (
              <RepostFavoritesStats
                isUnlisted={false}
                size={Size.SMALL}
                repostCount={reposts!}
                saveCount={favorites!}
                onClickReposts={onClickReposts!}
                onClickFavorites={onClickFavorites!}
                className={styles.statsWrapper}
              />
            ) : null}
            {agreementCount !== undefined && (
              <div className={styles.agreementCount}>
                {`${agreementCount} ${pluralize('Agreement', agreementCount)}`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

Card.defaultProps = {
  isUser: false,
  primaryText: '',
  secondaryText: '',
  onClick: () => {},
  className: '',
  isPlaylist: true
}

export default Card
