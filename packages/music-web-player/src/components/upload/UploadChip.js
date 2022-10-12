import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconPlus } from 'assets/img/iconMultiselectAdd.svg'
import { ReactComponent as IconUpload } from 'assets/img/iconUpload.svg'

import styles from './UploadChip.module.css'

const messages = {
  digital_content: 'Upload DigitalContent',
  aDigitalContent: 'Upload A DigitalContent',
  album: 'Upload New Album',
  contentList: 'Create New ContentList',
  landlordContentList: 'Upload New ContentList',
  firstAlbum: 'Upload Your First Album',
  firstContentList: 'Create Your First ContentList',
  firstLandlordContentList: 'Upload Your First ContentList'
}

const UploadChip = ({ type, variant, isLandlord = false, isFirst, onClick }) => {
  const icon =
    type === 'digital_content' || type === 'album' ? (
      <IconUpload className={styles.iconUpload} />
    ) : (
      <IconPlus className={styles.iconPlus} />
    )

  let text
  switch (type) {
    case 'digital_content':
      text = variant === 'nav' ? messages.digital_content : messages.aDigitalContent
      break
    case 'album':
      text = isFirst ? messages.firstAlbum : messages.album
      break
    case 'contentList':
      if (isLandlord) {
        text = isFirst ? messages.firstLandlordContentList : messages.landlordContentList
      } else {
        text = isFirst ? messages.firstContentList : messages.contentList
      }
      break
    default:
      break
  }

  return (
    <div
      className={cn(styles.uploadChip, {
        [styles.nav]: variant === 'nav',
        [styles.card]: variant === 'card',
        [styles.tile]: variant === 'tile'
      })}
      onClick={onClick}
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.text}>{text}</div>
    </div>
  )
}

UploadChip.propTypes = {
  type: PropTypes.oneOf(['digital_content', 'album', 'contentList']).isRequired,
  // nav: For display in a nav-like column
  // card: Looks like a 'Card'
  // tile: Looks like a 'DigitalContentTile'
  variant: PropTypes.oneOf(['nav', 'card', 'tile']).isRequired,
  // Is this upload the user's first of this type
  isFirst: PropTypes.bool,
  onClick: PropTypes.func
}

UploadChip.defaultProps = {
  type: 'digital_content',
  variant: 'tile',
  onClick: () => {}
}

export default UploadChip
