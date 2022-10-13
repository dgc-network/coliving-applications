import { memo } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './addDigitalContentsNotification.module.css'

const messages = {
  notice: 'Add more digitalContents to create an album or a contentList!',
  dismiss: 'Got it!'
}

const AddDigitalContentsNotification = (props) => {
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

AddDigitalContentsNotification.propTypes = {
  className: PropTypes.string,
  onDismiss: PropTypes.func,
  show: PropTypes.bool
}

export default memo(AddDigitalContentsNotification)
