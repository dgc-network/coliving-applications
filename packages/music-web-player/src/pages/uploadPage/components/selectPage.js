import { Component } from 'react'

import { Button, ButtonType, IconArrow } from '@coliving/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { SelectedServices } from 'components/serviceSelection'
import Dropzone from 'components/upload/dropzone'
import InvalidFileType from 'components/upload/invalidFileType'

import styles from './selectPage.module.css'
import DigitalContentsPreview from './digitalContentsPreview'
import UploadType from './uploadType'

class SelectPage extends Component {
  state = {
    showSelectServices: this.props.account
      ? !this.props.account.content_node_endpoint
      : false
  }

  componentDidUpdate() {
    const { account } = this.props
    if (
      account &&
      !account.content_node_endpoint &&
      !this.state.showSelectServices
    ) {
      this.setState({ showSelectServices: true })
    }
  }

  componentWillUnmount() {
    this.props.stopPreview()
  }

  render() {
    const {
      digitalContents = [],
      previewIndex,
      onSelect,
      onRemove,
      playPreview,
      stopPreview,
      onContinue,
      setUploadType,
      error,
      uploadType
    } = this.props
    const { showSelectServices } = this.state

    const textAboveIcon = digitalContents.length > 0 ? 'More to Upload?' : null

    return (
      <div className={cn(styles.page)}>
        <div className={styles.select}>
          <div className={styles.dropzone}>
            <Dropzone textAboveIcon={textAboveIcon} onDrop={onSelect} />
            {error ? (
              <InvalidFileType
                reason={error.reason}
                className={styles.invalidFileType}
              />
            ) : null}
          </div>
          <div
            className={cn(styles.uploaded, {
              [styles.hide]: digitalContents.length === 0
            })}
          >
            {digitalContents.length > 0 ? (
              <div>
                <DigitalContentsPreview
                  digitalContents={digitalContents}
                  uploadType={uploadType}
                  previewIndex={previewIndex}
                  onRemove={onRemove}
                  setUploadType={setUploadType}
                  playPreview={playPreview}
                  stopPreview={stopPreview}
                />
                <div className={styles.count}>
                  {digitalContents.length === 1
                    ? `${digitalContents.length} digital_content uploaded`
                    : `${digitalContents.length} digitalContents uploaded`}
                </div>
                <div className={styles.continue}>
                  <Button
                    type={ButtonType.PRIMARY_ALT}
                    text='Continue'
                    name='continue'
                    rightIcon={<IconArrow />}
                    onClick={onContinue}
                    textClassName={styles.continueButtonText}
                    className={styles.continueButton}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {showSelectServices && <SelectedServices requiresAtLeastOne />}
      </div>
    )
  }
}

SelectPage.propTypes = {
  account: PropTypes.object,
  uploadType: PropTypes.oneOf([
    UploadType.INDIVIDUAL_AGREEMENT,
    UploadType.INDIVIDUAL_AGREEMENTS,
    UploadType.CONTENT_LIST,
    UploadType.ALBUM
  ]),
  onCloseMultiDigitalContentNotification: PropTypes.func,
  digitalContents: PropTypes.array,
  previewIndex: PropTypes.number,
  dropdownMenu: PropTypes.object,
  onSelect: PropTypes.func,
  onRemove: PropTypes.func,
  playPreview: PropTypes.func,
  stopPreview: PropTypes.func,
  onContinue: PropTypes.func
}

export default SelectPage
