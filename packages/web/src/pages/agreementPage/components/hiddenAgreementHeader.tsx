import { ReactComponent as IconHidden } from 'assets/img/iconHidden.svg'

import styles from './HiddenAgreementHeader.module.css'

const messages = {
  hiddenAgreementTitle: 'HIDDEN AGREEMENT'
}

// Presents the Hidden Agreement title. Extracted for use in mobile and desktop
// agreement pages.
const HiddenAgreementHeader = () => {
  return (
    <div className={styles.hiddenHeaderContainer}>
      <IconHidden />
      <div className={styles.hiddenAgreementLabel}>{messages.hiddenAgreementTitle}</div>
    </div>
  )
}

export default HiddenAgreementHeader
