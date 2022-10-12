import { Component } from 'react'

import { DefaultSizes } from '@coliving/common'
import { ProgressBar } from '@coliving/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconArrow } from 'assets/img/iconArrow.svg'
import placeholderArt from 'assets/img/imageBlank2x.png'
import Toast from 'components/toast/toast'
import {
  DigitalContentArtwork,
  CollectionArtwork
} from 'components/digital_content/desktop/Artwork'
import ContentListTile from 'components/digital_content/desktop/contentListTile'
import DigitalContentListItem from 'components/digital_content/desktop/digitalContentListItem'
import DigitalContentTile from 'components/digital_content/desktop/digitalContentTile'
import { DigitalContentTileSize } from 'components/digital_content/types'
import { ComponentPlacement } from 'components/types'
import UserBadges from 'components/userBadges/userBadges'

import { ProgressStatus } from '../store/types'

import styles from './FinishPage.module.css'
import ShareBanner from './shareBanner'
import UploadType from './uploadType'

const TOAST_DELAY_MILLIS = 5 * 1000

const messages = {
  processing: 'Processing...',
  complete: 'Complete!',
  error: 'Error uploading one or more files, please try again'
}

const getShareUploadType = (uploadType, digitalContents) => {
  switch (uploadType) {
    case UploadType.INDIVIDUAL_AGREEMENT: {
      if (digitalContents.length > 0 && digitalContents[0].metadata.remix_of) {
        return 'Remix'
      }
      return 'DigitalContent'
    }
    case UploadType.INDIVIDUAL_AGREEMENTS:
      return 'DigitalContents'
    case UploadType.CONTENT_LIST:
      return 'ContentList'
    case UploadType.ALBUM:
      return 'Album'
    default:
      return ''
  }
}

const getUploadText = ({ loaded, total, status }) => {
  if (status === ProgressStatus.COMPLETE) return messages.complete
  if (!loaded || loaded === 0) return '0%'
  if (loaded !== total) return `${Math.round((loaded / total) * 100)} %`
  return messages.processing
}

class FinishPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showToast: false,
      didShowToast: false
    }
  }

  componentDidUpdate() {
    if (
      this.props.erroredDigitalContents.length > 0 &&
      this.props.uploadType === UploadType.INDIVIDUAL_AGREEMENTS &&
      !this.state.didShowToast
    ) {
      this.setState({
        showToast: true,
        didShowToast: true
      })

      setTimeout(() => {
        this.setState({ showToast: false })
      }, TOAST_DELAY_MILLIS)
    }
  }

  renderProgressBar = ({
    uploadText,
    uploadPercent,
    hasErrored = undefined
  }) => (
    <div className={cn(styles.uploadingInfo)}>
      <div className={styles.progressBar}>
        <ProgressBar
          value={uploadPercent}
          className={styles.progress}
          sliderBarClassName={styles.progressSlider}
        />
      </div>
      <div
        className={cn(styles.uploadText, {
          [styles.uploadComplete]: uploadText === 'Complete!'
        })}
      >
        {uploadText}
      </div>
    </div>
  )

  render() {
    const {
      account,
      digitalContents,
      uploadProgress,
      upload,
      metadata,
      uploadType,
      inProgress,
      onContinue,
      erroredDigitalContents,
      isFirstUpload
    } = this.props

    const tileProps = {
      size: DigitalContentTileSize.LARGE,
      isActive: false,
      isDisabled: true,
      showArtworkIcon: false,
      disableActions: true,
      uploading: true,
      showSkeleton: false
    }

    const erroredDigitalContentSet = new Set(erroredDigitalContents)

    let content
    if (
      uploadType === UploadType.INDIVIDUAL_AGREEMENT ||
      uploadType === UploadType.INDIVIDUAL_AGREEMENTS
    ) {
      content = digitalContents.map((digital_content, i) => {
        const hasErrored = erroredDigitalContentSet.has(i)
        const userName = (
          <div className={styles.userName}>
            <span className={styles.createdBy}>{account.name}</span>
            <UserBadges
              userId={account.user_id}
              className={styles.iconVerified}
              badgeSize={12}
            />
          </div>
        )

        const uploadPercent =
          (uploadProgress[i].loaded / uploadProgress[i].total) * 100

        const artwork = (
          <DigitalContentArtwork
            id={1} // Note the ID must be present to render the default overide image
            coverArtSizes={{
              [DefaultSizes.OVERRIDE]: digital_content.metadata.artwork.url
                ? digital_content.metadata.artwork.url
                : placeholderArt
            }}
            size={'large'}
            isBuffering={false}
            isPlaying={false}
            showArtworkIcon={false}
            showSkeleton={false}
          />
        )
        const uploadText = getUploadText({ ...uploadProgress[i] })
        const bottomBar = this.renderProgressBar({
          uploadText,
          uploadPercent,
          hasErrored
        })

        return (
          <div key={digital_content.metadata.title + i} className={styles.digitalContentTile}>
            <DigitalContentTile
              userName={userName}
              title={digital_content.metadata.title}
              standalone
              artwork={artwork}
              bottomBar={bottomBar}
              showIconButtons={false}
              coverArtSizes={{
                [DefaultSizes.OVERRIDE]: digital_content.metadata.artwork.url
                  ? digital_content.metadata.artwork.url
                  : placeholderArt
              }}
              {...tileProps}
            />
          </div>
        )
      })
    } else {
      let header = 'ALBUM'
      if (uploadType === UploadType.CONTENT_LIST) {
        header = 'CONTENT_LIST'
      }
      const t = digitalContents.map((digital_content) => {
        const { duration } = digital_content.preview
        return {
          ...digital_content.metadata,
          user: account,
          duration
        }
      })
      const loaded = uploadProgress.reduce((avg, v) => avg + v.loaded, 0)
      const total = uploadProgress.reduce((avg, v) => avg + v.total, 0)

      const status =
        // Don't show complete until inProgress = false, to allow
        // the saga to perform final processing steps (e.g. create a contentList after uploading digitalContents)
        uploadProgress
          .map((u) => u.status)
          .every((s) => s === ProgressStatus.COMPLETE) && !inProgress
          ? ProgressStatus.COMPLETE
          : ProgressStatus.UPLOADING

      const averagePercent = (loaded / total) * 100

      const uploadText = getUploadText({ loaded, total, status })
      const bottomBar = this.renderProgressBar({
        uploadText,
        uploadPercent: averagePercent
      })

      const userName = (
        <div className={styles.userName}>
          <span className={styles.createdBy}>{`Created by `}</span>
          <span className={styles.createdBy}>{account.name}</span>
          <UserBadges
            userId={account.user_id}
            className={styles.iconVerified}
            badgeSize={12}
          />
        </div>
      )

      const artwork = (
        <CollectionArtwork
          id={1} // Note the ID must be present to render the default overide image
          coverArtSizes={{
            [DefaultSizes.OVERRIDE]:
              metadata.artwork && metadata.artwork.url
                ? metadata.artwork.url
                : placeholderArt
          }}
          size={'large'}
          isBuffering={false}
          isPlaying={false}
          showArtworkIcon={false}
          showSkeleton={false}
        />
      )

      const digitalContentList = t.map((digital_content, i) => (
        <DigitalContentListItem
          index={i}
          key={`${digital_content.title}+${i}`}
          isLoading={false}
          active={false}
          size={DigitalContentTileSize.LARGE}
          disableActions={true}
          playing={false}
          digital_content={digital_content}
          landlordHandle={account.handle}
        />
      ))

      content = (
        <ContentListTile
          header={header}
          userName={userName}
          digitalContentList={digitalContentList}
          title={metadata.content_list_name}
          artwork={artwork}
          activeDigitalContentUid={false} // No digital_content should show as active
          bottomBar={bottomBar}
          showIconButtons={false}
          containerClassName={styles.digitalContentListContainer}
          {...tileProps}
        />
      )
    }

    let continueText
    switch (uploadType) {
      case UploadType.INDIVIDUAL_AGREEMENT:
        continueText = 'View DigitalContent Page'
        break
      case UploadType.CONTENT_LIST:
        continueText = 'View ContentList'
        break
      case UploadType.ALBUM:
        continueText = 'View Album'
        break
      default:
        continueText = 'View DigitalContents'
    }
    const shareUploadType = getShareUploadType(uploadType, digitalContents)
    return (
      <Toast
        firesOnClick={false}
        text={messages.error}
        open={this.state.showToast}
        placement={ComponentPlacement.BOTTOM}
      >
        <div className={styles.finish}>
          {!isFirstUpload && (
            <ShareBanner
              type={shareUploadType}
              isHidden={inProgress}
              digitalContents={digitalContents}
              upload={upload}
              metadata={metadata}
              user={account}
            />
          )}
          {content}
          <div className={styles.buttons}>
            <button
              name='viewMedia'
              onClick={inProgress ? undefined : onContinue}
              className={cn(styles.continueButton, {
                [styles.isHidden]: inProgress
              })}
            >
              <div>{continueText}</div>
              <IconArrow className={styles.iconArrow} />
            </button>
          </div>
        </div>
      </Toast>
    )
  }
}

FinishPage.propTypes = {
  account: PropTypes.object,
  digitalContents: PropTypes.array,
  uploadType: PropTypes.oneOf(Object.values(UploadType)),
  uploadProgress: PropTypes.array,
  /** Whether an upload is in progress. Only shows actions after upload is 'done.' */
  inProgress: PropTypes.bool,
  onContinue: PropTypes.func,
  isFirstUpload: PropTypes.bool
}

export default FinishPage
