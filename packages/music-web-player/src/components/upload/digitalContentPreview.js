import { Component } from 'react'

import numeral from 'numeral'
import PropTypes from 'prop-types'

import iconFileAiff from 'assets/img/iconFileAiff.svg'
import iconFileFlac from 'assets/img/iconFileFlac.svg'
import iconFileMp3 from 'assets/img/iconFileMp3.svg'
import iconFileOgg from 'assets/img/iconFileOgg.svg'
import iconFileUnknown from 'assets/img/iconFileUnknown.svg'
import iconFileWav from 'assets/img/iconFileWav.svg'
import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'
import PreviewButton from 'components/upload/previewButton'

import styles from './DigitalContentPreview.module.css'

const supportsPreview = new Set([
  'digitalcoin/mpeg',
  'digitalcoin/mp3',
  'digitalcoin/ogg',
  'digitalcoin/wav'
])

class DigitalContentPreview extends Component {
  fileTypeIcon = (type) => {
    switch (type) {
      case 'digitalcoin/mpeg':
      case 'digitalcoin/mp3':
        return iconFileMp3
      case 'digitalcoin/aiff':
        return iconFileAiff
      case 'digitalcoin/flac':
        return iconFileFlac
      case 'digitalcoin/ogg':
        return iconFileOgg
      case 'digitalcoin/wav':
        return iconFileWav
      default:
        return iconFileUnknown
    }
  }

  render() {
    const {
      fileType,
      digitalContentTitle,
      fileSize,
      playing,
      onRemove,
      onPlayPreview,
      onStopPreview
    } = this.props

    const onPreviewClick = playing ? onStopPreview : onPlayPreview

    return (
      <div className={styles.digitalContentPreview}>
        <div className={styles.digitalContentDetails}>
          <img src={this.fileTypeIcon(fileType)} alt='File type icon' />
          <div className={styles.digitalContentTitle}>{digitalContentTitle}</div>
          <div className={styles.fileSize}>
            {numeral(fileSize).format('0.0 b')}
          </div>
        </div>
        <div className={styles.actions}>
          <div onClick={onPreviewClick}>
            {supportsPreview.has(fileType) && (
              <PreviewButton playing={playing} />
            )}
          </div>
          <IconRemove className={styles.remove} onClick={onRemove} />
        </div>
      </div>
    )
  }
}

DigitalContentPreview.propTypes = {
  fileType: PropTypes.string,
  digitalContentTitle: PropTypes.string,
  fileSize: PropTypes.number,
  playing: PropTypes.bool,
  onRemove: PropTypes.func,
  onPlayPreview: PropTypes.func,
  onStopPreview: PropTypes.func
}

DigitalContentPreview.defaultProps = {
  fileType: 'mp3',
  digitalContentTitle: 'Untitled',
  fileSize: '7MB'
}

export default DigitalContentPreview
