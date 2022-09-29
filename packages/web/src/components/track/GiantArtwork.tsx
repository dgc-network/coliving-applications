import { memo, useEffect } from 'react'

import { CoverArtSizes, SquareSizes, Remix } from '@coliving/common'

import CoSign from 'components/coSign/coSign'
import { Size } from 'components/coSign/types'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'

import styles from './GiantArtwork.module.css'

type GiantArtworkProps = {
  agreementId: number
  coverArtSizes: CoverArtSizes
  coSign: Remix
  callback: () => void
}

const GiantArtwork = ({
  agreementId,
  coverArtSizes,
  coSign,
  callback
}: GiantArtworkProps) => {
  const image = useAgreementCoverArt(
    agreementId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000,
    ''
  )
  useEffect(() => {
    if (image) callback()
  }, [image, callback])
  return coSign ? (
    <CoSign
      size={Size.XLARGE}
      hasFavorited={coSign.has_remix_author_saved}
      hasReposted={coSign.has_remix_author_reposted}
      coSignName={coSign.user.name}
      className={styles.giantArtwork}
      userId={coSign.user?.user_id}
    >
      <DynamicImage wrapperClassName={styles.imageWrapper} image={image} />
    </CoSign>
  ) : (
    <div className={styles.giantArtwork}>
      <DynamicImage wrapperClassName={styles.imageWrapper} image={image} />
    </div>
  )
}

export default memo(GiantArtwork)
