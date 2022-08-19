import { SquareSizes } from '@coliving/common'

import { AgreementEntity } from 'common/store/notifications/types'
import CoSign, { Size } from 'components/co-sign/CoSign'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'

import styles from './AgreementContent.module.css'

type AgreementContentProps = {
  agreement: AgreementEntity
}

export const AgreementContent = (props: AgreementContentProps) => {
  const { agreement } = props

  const image = useAgreementCoverArt(
    agreement.agreement_id,
    agreement._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div className={styles.agreementContent}>
      <CoSign hideTooltip size={Size.SMALL} className={styles.cosign}>
        <DynamicImage
          wrapperClassName={styles.agreementContentArtwork}
          image={image}
        />
      </CoSign>
      <span className={styles.agreementContentText}>{agreement.title}</span>
    </div>
  )
}
