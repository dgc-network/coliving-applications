import { memo, MouseEvent } from 'react'

import { ID, CoverArtSizes, SquareSizes } from '@coliving/common'
import { IconKebabHorizontal, IconButton } from '@coliving/stems'
import cn from 'classnames'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { ReactComponent as IconDrag } from 'assets/img/iconDrag.svg'
import { ReactComponent as IconHeart } from 'assets/img/iconHeart.svg'
import { ReactComponent as IconRemoveDigitalContent } from 'assets/img/iconRemoveDigitalContent.svg'
import { ReactComponent as IconPause } from 'assets/img/pbIconPause.svg'
import { ReactComponent as IconPlay } from 'assets/img/pbIconPlay.svg'
import TablePlayButton from 'components/digitalContentsTable/tablePlayButton'
import UserBadges from 'components/userBadges/userBadges'
import { useDigitalContentCoverArt } from 'hooks/useDigitalContentCoverArt'

import styles from './DigitalContentListItem.module.css'

export enum DigitalContentItemAction {
  Save = 'save',
  Overflow = 'overflow'
}

type ArtworkIconProps = {
  isLoading: boolean
  isPlaying: boolean
}

const ArtworkIcon = ({ isLoading, isPlaying }: ArtworkIconProps) => {
  let artworkIcon
  if (isLoading) {
    artworkIcon = (
      <div className={styles.loadingAnimation}>
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: loadingSpinner
          }}
        />
      </div>
    )
  } else if (isPlaying) {
    artworkIcon = <IconPause />
  } else {
    artworkIcon = <IconPlay />
  }
  return <div className={styles.artworkIcon}>{artworkIcon}</div>
}

type ArtworkProps = {
  digitalContentId: ID
  isLoading: boolean
  isActive?: boolean
  isPlaying: boolean
  coverArtSizes: CoverArtSizes
}
const Artwork = ({
  digitalContentId,
  isPlaying,
  isActive,
  isLoading,
  coverArtSizes
}: ArtworkProps) => {
  const image = useDigitalContentCoverArt(
    digitalContentId,
    coverArtSizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div className={styles.artworkContainer}>
      <div
        className={cn(styles.artwork, {})}
        style={
          image
            ? {
                backgroundImage: `url(${image})`
              }
            : {}
        }
      >
        {isActive ? (
          <ArtworkIcon isLoading={isLoading} isPlaying={isPlaying} />
        ) : null}
      </div>
    </div>
  )
}

const getMessages = ({ isDeleted = false }: { isDeleted?: boolean } = {}) => ({
  deleted: isDeleted ? ' [Deleted By Author]' : ''
})

export type DigitalContentListItemProps = {
  className?: string
  index: number
  isLoading: boolean
  isSaved?: boolean
  isReposted?: boolean
  isActive?: boolean
  isPlaying?: boolean
  isRemoveActive?: boolean
  isDeleted: boolean
  coverArtSizes?: CoverArtSizes
  landlordName: string
  landlordHandle: string
  digitalContentTitle: string
  digitalContentId: ID
  userId: ID
  uid?: string
  isReorderable?: boolean
  isDragging?: boolean
  onSave?: (isSaved: boolean, digitalContentId: ID) => void
  onRemove?: (digitalContentId: ID) => void
  togglePlay?: (uid: string, digitalContentId: ID) => void
  onClickOverflow?: () => void
  digitalContentItemAction?: DigitalContentItemAction
}

const DigitalContentListItem = ({
  className,
  isLoading,
  index,
  isSaved = false,
  isActive = false,
  isPlaying = false,
  isRemoveActive = false,
  landlordName,
  digitalContentTitle,
  digitalContentId,
  userId,
  uid,
  coverArtSizes,
  isDeleted,
  onSave,
  onRemove,
  togglePlay,
  digitalContentItemAction,
  onClickOverflow,
  isReorderable = false,
  isDragging = false
}: DigitalContentListItemProps) => {
  const messages = getMessages({ isDeleted })

  const onClickDigitalContent = () => {
    if (uid && !isDeleted && togglePlay) togglePlay(uid, digitalContentId)
  }

  const onSaveDigitalContent = (e: MouseEvent) => {
    e.stopPropagation()
    if (isDeleted && !isSaved) return
    if (onSave) onSave(isSaved, digitalContentId)
  }

  const onRemoveDigitalContent = (e: MouseEvent<Element>) => {
    e.stopPropagation()
    if (onRemove) onRemove(index)
  }

  return (
    <div
      className={cn(styles.digitalContentContainer, className, {
        [styles.isActive]: isActive,
        [styles.isDeleted]: isDeleted,
        [styles.isReorderable]: isReorderable,
        [styles.isDragging]: isDragging
      })}
      onClick={onClickDigitalContent}
    >
      {coverArtSizes ? (
        <div>
          <Artwork
            digitalContentId={digitalContentId}
            coverArtSizes={coverArtSizes}
            isActive={isActive}
            isLoading={isLoading}
            isPlaying={isPlaying}
          />
        </div>
      ) : isActive && !isDeleted ? (
        <div className={styles.playButtonContainer}>
          <TablePlayButton
            playing={true}
            paused={!isPlaying}
            hideDefault={false}
          />
        </div>
      ) : null}
      {isReorderable && <IconDrag className={styles.dragIcon} />}

      <div className={styles.nameLandlordContainer}>
        <div className={styles.digitalContentTitle}>
          {digitalContentTitle}
          {messages.deleted}
        </div>
        <div className={styles.landlordName}>
          {landlordName}
          <UserBadges
            userId={userId}
            badgeSize={12}
            className={styles.badges}
          />
        </div>
      </div>
      {onSaveDigitalContent && digitalContentItemAction === DigitalContentItemAction.Save && (
        <div className={styles.iconContainer} onClick={onSaveDigitalContent}>
          <IconHeart
            className={cn(styles.heartIcon, { [styles.isSaved]: isSaved })}
          />
        </div>
      )}
      {onClickOverflow && digitalContentItemAction === DigitalContentItemAction.Overflow && (
        <div className={styles.iconContainer}>
          <IconButton
            aria-label='more actions'
            icon={<IconKebabHorizontal />}
            className={styles.kebabContainer}
            onClick={(e) => {
              e.stopPropagation()
              onClickOverflow()
            }}
          />
        </div>
      )}
      {onRemove && (
        <div className={styles.iconContainer}>
          <IconButton
            aria-label='remove digital_content'
            icon={<IconRemoveDigitalContent />}
            className={cn(styles.removeDigitalContentContainer, {
              [styles.isRemoveActive]: isRemoveActive
            })}
            onClick={onRemoveDigitalContent}
          />
        </div>
      )}
    </div>
  )
}

export default memo(DigitalContentListItem)
