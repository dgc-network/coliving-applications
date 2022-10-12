import { ReactComponent as IconHidden } from 'assets/img/iconHidden.svg'

import styles from './hiddenAgreementHeader.module.css'

const messages = {
  hiddenAgreementTitle: 'HIDDEN AGREEMENT'
}

// Presents the Hidden DigitalContent title. Extracted for use in mobile and desktop
// digital_content pages.
const HiddenAgreementHeader = () => {
  return (
    <div className={styles.hiddenHeaderContainer}>
      <IconHidden />
      <div className={styles.hiddenAgreementLabel}>{messages.hiddenAgreementTitle}</div>
    </div>
  )
}

export default HiddenAgreementHeader
