import { memo, MouseEvent } from 'react'

import { ID, CoverArtSizes, SquareSizes } from '@coliving/common'
import { IconKebabHorizontal, IconButton } from '@coliving/stems'
import cn from 'classnames'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { ReactComponent as IconDrag } from 'assets/img/iconDrag.svg'
import { ReactComponent as IconHeart } from 'assets/img/iconHeart.svg'
import { ReactComponent as IconRemoveAgreement } from 'assets/img/iconRemoveAgreement.svg'
import { ReactComponent as IconPause } from 'assets/img/pbIconPause.svg'
import { ReactComponent as IconPlay } from 'assets/img/pbIconPlay.svg'
import TablePlayButton from 'components/agreementsTable/tablePlayButton'
import UserBadges from 'components/userBadges/userBadges'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'

import styles from './AgreementListItem.module.css'

export enum AgreementItemAction {
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
  agreementId: ID
  isLoading: boolean
  isActive?: boolean
  isPlaying: boolean
  coverArtSizes: CoverArtSizes
}
const Artwork = ({
  agreementId,
  isPlaying,
  isActive,
  isLoading,
  coverArtSizes
}: ArtworkProps) => {
  const image = useAgreementCoverArt(
    agreementId,
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
  deleted: isDeleted ? ' [Deleted By Landlord]' : ''
})

export type AgreementListItemProps = {
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
  agreementTitle: string
  agreementId: ID
  userId: ID
  uid?: string
  isReorderable?: boolean
  isDragging?: boolean
  onSave?: (isSaved: boolean, agreementId: ID) => void
  onRemove?: (agreementId: ID) => void
  togglePlay?: (uid: string, agreementId: ID) => void
  onClickOverflow?: () => void
  agreementItemAction?: AgreementItemAction
}

const AgreementListItem = ({
  className,
  isLoading,
  index,
  isSaved = false,
  isActive = false,
  isPlaying = false,
  isRemoveActive = false,
  landlordName,
  agreementTitle,
  agreementId,
  userId,
  uid,
  coverArtSizes,
  isDeleted,
  onSave,
  onRemove,
  togglePlay,
  agreementItemAction,
  onClickOverflow,
  isReorderable = false,
  isDragging = false
}: AgreementListItemProps) => {
  const messages = getMessages({ isDeleted })

  const onClickAgreement = () => {
    if (uid && !isDeleted && togglePlay) togglePlay(uid, agreementId)
  }

  const onSaveAgreement = (e: MouseEvent) => {
    e.stopPropagation()
    if (isDeleted && !isSaved) return
    if (onSave) onSave(isSaved, agreementId)
  }

  const onRemoveAgreement = (e: MouseEvent<Element>) => {
    e.stopPropagation()
    if (onRemove) onRemove(index)
  }

  return (
    <div
      className={cn(styles.agreementContainer, className, {
        [styles.isActive]: isActive,
        [styles.isDeleted]: isDeleted,
        [styles.isReorderable]: isReorderable,
        [styles.isDragging]: isDragging
      })}
      onClick={onClickAgreement}
    >
      {coverArtSizes ? (
        <div>
          <Artwork
            agreementId={agreementId}
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
        <div className={styles.agreementTitle}>
          {agreementTitle}
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
      {onSaveAgreement && agreementItemAction === AgreementItemAction.Save && (
        <div className={styles.iconContainer} onClick={onSaveAgreement}>
          <IconHeart
            className={cn(styles.heartIcon, { [styles.isSaved]: isSaved })}
          />
        </div>
      )}
      {onClickOverflow && agreementItemAction === AgreementItemAction.Overflow && (
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
            aria-label='remove agreement'
            icon={<IconRemoveAgreement />}
            className={cn(styles.removeAgreementContainer, {
              [styles.isRemoveActive]: isRemoveActive
            })}
            onClick={onRemoveAgreement}
          />
        </div>
      )}
    </div>
  )
}

export default memo(AgreementListItem)
