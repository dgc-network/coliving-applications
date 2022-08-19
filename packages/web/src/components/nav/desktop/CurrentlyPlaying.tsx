import { memo, useRef, MouseEvent } from 'react'

import { Color, CoverArtSizes, SquareSizes, Nullable } from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconVisualizer } from 'assets/img/iconVisualizer.svg'
import Draggable from 'components/dragndrop/Draggable'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'

import styles from './CurrentlyPlaying.module.css'

type CurrentlyPlayingProps = {
  isOwner: boolean
  isUnlisted: boolean
  agreementId: Nullable<number>
  agreementTitle: Nullable<string>
  coverArtSizes: Nullable<CoverArtSizes>
  coverArtColor: Nullable<Color>
  artworkLink?: Nullable<string>
  draggableLink: Nullable<string>
  onClick: () => void
  onShowVisualizer: (e: MouseEvent) => void
}

type ArtworkStyle = {
  backgroundImage?: string
  backgroundColor?: string
}

type WrapperStyle = {
  boxShadow: string
}

const CurrentlyPlaying = ({
  isOwner,
  isUnlisted,
  agreementId,
  agreementTitle,
  coverArtSizes,
  coverArtColor,
  artworkLink,
  draggableLink,
  onClick,
  onShowVisualizer
}: CurrentlyPlayingProps) => {
  const previousAgreementId = useRef(0)

  const image = useAgreementCoverArt(
    agreementId,
    coverArtSizes,
    SquareSizes.SIZE_480_BY_480,
    ''
  )

  let newAgreement = false
  if (agreementId && agreementId !== previousAgreementId.current) {
    newAgreement = true
    previousAgreementId.current = agreementId
  }

  let wrapperStyle: WrapperStyle
  let artworkStyle: ArtworkStyle
  if (agreementId) {
    const artworkAverageColor = coverArtColor ?? { r: 13, g: 16, b: 18 }
    wrapperStyle = {
      boxShadow: `0 1px 20px -3px rgba(
        ${artworkAverageColor.r},
        ${artworkAverageColor.g},
        ${artworkAverageColor.b}
        , 0.7)`
    }
    artworkStyle = {}
  } else {
    wrapperStyle = {
      boxShadow: '0 1px 15px -2px var(--currently-playing-default-shadow)'
    }
    artworkStyle = {
      backgroundColor: 'var(--neutral-light-8)'
    }
  }

  return (
    <Draggable
      isDisabled={!agreementId || isUnlisted}
      text={agreementTitle}
      kind='agreement'
      id={agreementId}
      isOwner={isOwner}
      link={draggableLink}
    >
      <div
        className={cn(styles.artworkWrapper, {
          [styles.playing]: !!agreementId
        })}
        style={wrapperStyle}
        onClick={onClick}
      >
        <DynamicImage
          useSkeleton={false}
          image={artworkLink ?? image}
          immediate={newAgreement}
          className={styles.artwork}
          imageStyle={artworkStyle}
        >
          <div
            className={cn(styles.bottomRightContainer, {
              [styles.hide]: !agreementId
            })}
          >
            <div
              onClick={(e) => onShowVisualizer(e)}
              className={styles.visualizerIconContainer}
            >
              <IconVisualizer className={styles.visualizerIcon} />
            </div>
          </div>
        </DynamicImage>
      </div>
    </Draggable>
  )
}

export default memo(CurrentlyPlaying)
