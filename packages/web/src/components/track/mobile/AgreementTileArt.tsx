import { memo } from 'react'

import { ID, CoverArtSizes, SquareSizes, Remix } from '@coliving/common'
import cn from 'classnames'

import { useLoadImageWithTimeout } from 'common/hooks/useImageSize'
import CoSign from 'components/co-sign/CoSign'
import { Size } from 'components/co-sign/types'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'

import styles from './AgreementTileArt.module.css'

type AgreementTileArtProps = {
  isAgreement: boolean
  id: ID
  coverArtSizes: CoverArtSizes
  className?: string
  showSkeleton?: boolean
  coSign?: Remix | null
  // Called when the image is done loading
  callback: () => void
}

const AgreementTileArt = ({
  id,
  isAgreement,
  className,
  coverArtSizes,
  showSkeleton,
  coSign,
  callback
}: AgreementTileArtProps) => {
  const useImage = isAgreement ? useAgreementCoverArt : useCollectionCoverArt
  const image = useImage(id, coverArtSizes, SquareSizes.SIZE_150_BY_150)

  useLoadImageWithTimeout(image, callback)

  return coSign ? (
    <CoSign
      size={Size.SMALL}
      className={cn(styles.container, className)}
      hasFavorited={coSign.has_remix_author_saved}
      hasReposted={coSign.has_remix_author_reposted}
      coSignName={coSign.user.name}
      userId={coSign.user.user_id}
    >
      <DynamicImage
        image={showSkeleton ? '' : image}
        wrapperClassName={styles.imageWrapper}
      />
    </CoSign>
  ) : (
    <DynamicImage
      image={showSkeleton ? '' : image}
      wrapperClassName={cn(styles.container, styles.imageWrapper, className)}
    />
  )
}

export default memo(AgreementTileArt)
