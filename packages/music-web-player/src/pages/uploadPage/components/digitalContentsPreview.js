import { Scrollbar } from '@coliving/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import TabSlider from 'components/dataEntry/tabSlider'
import DigitalContentPreview from 'components/upload/digitalContentPreview'

import styles from './digitalContentsPreview.module.css'
import UploadType from './uploadType'

const uploadDescriptions = {
  [UploadType.CONTENT_LIST]:
    'A contentList is a living thing that can change and grow over time. ContentLists can contain your own digitalContents, as well as digitalContents uploaded by others.',
  [UploadType.ALBUM]:
    'An album is a curated listening experience that is frozen in time and does not change. Albums can only contain digitalContents that you upload.',
  [UploadType.INDIVIDUAL_AGREEMENTS]:
    'Every digital_content you upload will be a separate post.',
  [UploadType.INDIVIDUAL_AGREEMENT]:
    'Every digital_content you upload will be a separate post.'
}

const DigitalContentsPreview = (props) => {
  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>Release Type</div>
        <TabSlider
          className={styles.tabSlider}
          onSelectOption={props.setUploadType}
          selected={props.uploadType}
          options={[
            { key: UploadType.INDIVIDUAL_AGREEMENTS, text: 'DigitalContents' },
            { key: UploadType.ALBUM, text: 'Album' },
            { key: UploadType.CONTENT_LIST, text: 'ContentList' }
          ]}
        />
        <div className={styles.typeDescription}>
          {uploadDescriptions[props.uploadType]}
        </div>
      </div>
      <Scrollbar
        className={cn(styles.digitalContents, {
          [styles.shortScroll]:
            props.uploadType !== UploadType.INDIVIDUAL_AGREEMENTS
        })}
      >
        {props.digitalContents.map((digital_content, i) => (
          <DigitalContentPreview
            key={digital_content.metadata.title + i}
            digitalContentTitle={digital_content.metadata.title}
            fileType={digital_content.file.type}
            fileSize={digital_content.file.size}
            playing={props.previewIndex === i}
            onRemove={() => props.onRemove(i)}
            onPlayPreview={() => props.playPreview(i)}
            onStopPreview={() => props.stopPreview()}
          />
        ))}
      </Scrollbar>
    </div>
  )
}

DigitalContentsPreview.propTypes = {
  uploadType: PropTypes.oneOf([
    UploadType.INDIVIDUAL_AGREEMENT,
    UploadType.INDIVIDUAL_AGREEMENTS,
    UploadType.CONTENT_LIST,
    UploadType.ALBUM
  ]),
  digitalContents: PropTypes.array,
  setUploadType: PropTypes.func,
  playPreview: PropTypes.func,
  stopPreview: PropTypes.func,
  onRemove: PropTypes.func,
  previewIndex: PropTypes.number
}

export default DigitalContentsPreview
