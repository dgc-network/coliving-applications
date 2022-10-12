import { memo, useRef, MouseEvent } from 'react'

import { Color, CoverArtSizes, SquareSizes, Nullable } from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconVisualizer } from 'assets/img/iconVisualizer.svg'
import Draggable from 'components/dragndrop/draggable'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import { useDigitalContentCoverArt } from 'hooks/useDigitalContentCoverArt'

import styles from './CurrentlyPlaying.module.css'

type CurrentlyPlayingProps = {
  isOwner: boolean
  isUnlisted: boolean
  digitalContentId: Nullable<number>
  digitalContentTitle: Nullable<string>
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
  digitalContentId,
  digitalContentTitle,
  coverArtSizes,
  coverArtColor,
  artworkLink,
  draggableLink,
  onClick,
  onShowVisualizer
}: CurrentlyPlayingProps) => {
  const previousDigitalContentId = useRef(0)

  const image = useDigitalContentCoverArt(
    digitalContentId,
    coverArtSizes,
    SquareSizes.SIZE_480_BY_480,
    ''
  )

  let newDigitalContent = false
  if (digitalContentId && digitalContentId !== previousDigitalContentId.current) {
    newDigitalContent = true
    previousDigitalContentId.current = digitalContentId
  }

  let wrapperStyle: WrapperStyle
  let artworkStyle: ArtworkStyle
  if (digitalContentId) {
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
      isDisabled={!digitalContentId || isUnlisted}
      text={digitalContentTitle}
      kind='digital_content'
      id={digitalContentId}
      isOwner={isOwner}
      link={draggableLink}
    >
      <div
        className={cn(styles.artworkWrapper, {
          [styles.playing]: !!digitalContentId
        })}
        style={wrapperStyle}
        onClick={onClick}
      >
        <DynamicImage
          useSkeleton={false}
          image={artworkLink ?? image}
          immediate={newDigitalContent}
          className={styles.artwork}
          imageStyle={artworkStyle}
        >
          <div
            className={cn(styles.bottomRightContainer, {
              [styles.hide]: !digitalContentId
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
