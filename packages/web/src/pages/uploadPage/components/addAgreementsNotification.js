import { memo } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './addAgreementsNotification.module.css'

const messages = {
  notice: 'Add more agreements to create an album or a contentList!',
  dismiss: 'Got it!'
}

const AddAgreementsNotification = (props) => {
  return (
    <div
      className={cn(styles.container, {
        [props.className]: !!props.className,
        [styles.hidden]: !props.show
      })}
    >
      <div className={styles.notice}>{messages.notice}</div>
      <div className={styles.dismiss} onClick={props.onDismiss}>
        {messages.dismiss}
      </div>
    </div>
  )
}

AddAgreementsNotification.propTypes = {
  className: PropTypes.string,
  onDismiss: PropTypes.func,
  show: PropTypes.bool
}

export default memo(AddAgreementsNotification)
