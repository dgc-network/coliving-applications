import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconPlus } from 'assets/img/iconMultiselectAdd.svg'
import { ReactComponent as IconUpload } from 'assets/img/iconUpload.svg'

import styles from './UploadChip.module.css'

const messages = {
  agreement: 'Upload Agreement',
  aAgreement: 'Upload A Agreement',
  album: 'Upload New Album',
  content list: 'Create New ContentList',
  artistContentList: 'Upload New ContentList',
  firstAlbum: 'Upload Your First Album',
  firstContentList: 'Create Your First ContentList',
  firstArtistContentList: 'Upload Your First ContentList'
}

const UploadChip = ({ type, variant, isArtist = false, isFirst, onClick }) => {
  const icon =
    type === 'agreement' || type === 'album' ? (
      <IconUpload className={styles.iconUpload} />
    ) : (
      <IconPlus className={styles.iconPlus} />
    )

  let text
  switch (type) {
    case 'agreement':
      text = variant === 'nav' ? messages.agreement : messages.aAgreement
      break
    case 'album':
      text = isFirst ? messages.firstAlbum : messages.album
      break
    case 'content list':
      if (isArtist) {
        text = isFirst ? messages.firstArtistContentList : messages.artistContentList
      } else {
        text = isFirst ? messages.firstContentList : messages.content list
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
  type: PropTypes.oneOf(['agreement', 'album', 'content list']).isRequired,
  // nav: For display in a nav-like column
  // card: Looks like a 'Card'
  // tile: Looks like a 'AgreementTile'
  variant: PropTypes.oneOf(['nav', 'card', 'tile']).isRequired,
  // Is this upload the user's first of this type
  isFirst: PropTypes.bool,
  onClick: PropTypes.func
}

UploadChip.defaultProps = {
  type: 'agreement',
  variant: 'tile',
  onClick: () => {}
}

export default UploadChip
