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

import styles from './AgreementPreview.module.css'

const supportsPreview = new Set([
  'live/mpeg',
  'live/mp3',
  'live/ogg',
  'live/wav'
])

class AgreementPreview extends Component {
  fileTypeIcon = (type) => {
    switch (type) {
      case 'live/mpeg':
      case 'live/mp3':
        return iconFileMp3
      case 'live/aiff':
        return iconFileAiff
      case 'live/flac':
        return iconFileFlac
      case 'live/ogg':
        return iconFileOgg
      case 'live/wav':
        return iconFileWav
      default:
        return iconFileUnknown
    }
  }

  render() {
    const {
      fileType,
      agreementTitle,
      fileSize,
      playing,
      onRemove,
      onPlayPreview,
      onStopPreview
    } = this.props

    const onPreviewClick = playing ? onStopPreview : onPlayPreview

    return (
      <div className={styles.agreementPreview}>
        <div className={styles.agreementDetails}>
          <img src={this.fileTypeIcon(fileType)} alt='File type icon' />
          <div className={styles.agreementTitle}>{agreementTitle}</div>
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

AgreementPreview.propTypes = {
  fileType: PropTypes.string,
  agreementTitle: PropTypes.string,
  fileSize: PropTypes.number,
  playing: PropTypes.bool,
  onRemove: PropTypes.func,
  onPlayPreview: PropTypes.func,
  onStopPreview: PropTypes.func
}

AgreementPreview.defaultProps = {
  fileType: 'mp3',
  agreementTitle: 'Untitled',
  fileSize: '7MB'
}

export default AgreementPreview
