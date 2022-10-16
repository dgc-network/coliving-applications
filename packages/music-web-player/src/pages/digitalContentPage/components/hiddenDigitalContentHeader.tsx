import { ReactComponent as IconHidden } from 'assets/img/iconHidden.svg'

import styles from './hiddenDigitalContentHeader.module.css'

const messages = {
  hiddenDigitalContentTitle: 'HIDDEN DIGITAL_CONTENT'
}

// Presents the Hidden DigitalContent title. Extracted for use in mobile and desktop
// digital_content pages.
const HiddenDigitalContentHeader = () => {
  return (
    <div className={styles.hiddenHeaderContainer}>
      <IconHidden />
      <div className={styles.hiddenDigitalContentLabel}>{messages.hiddenDigitalContentTitle}</div>
    </div>
  )
}

export default HiddenDigitalContentHeader
