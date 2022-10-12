import { SquareSizes } from '@coliving/common'

import { DigitalContentEntity } from 'common/store/notifications/types'
import CoSign, { Size } from 'components/coSign/coSign'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import { useDigitalContentCoverArt } from 'hooks/useDigitalContentCoverArt'

import styles from './digitalContent.module.css'

type DigitalContentProps = {
  digital_content: DigitalContentEntity
}

export const DigitalContent = (props: DigitalContentProps) => {
  const { digital_content } = props

  const image = useDigitalContentCoverArt(
    digital_content.digital_content_id,
    digital_content._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div className={styles.digitalContent}>
      <CoSign hideTooltip size={Size.SMALL} className={styles.cosign}>
        <DynamicImage
          wrapperClassName={styles.digitalContentArtwork}
          image={image}
        />
      </CoSign>
      <span className={styles.digitalContentText}>{digital_content.title}</span>
    </div>
  )
}
