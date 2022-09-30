import { Component } from 'react'

import { Name } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Spring } from 'react-spring/renderprops'

import { getAccountUser } from 'common/store/account/selectors'
import { pause as pauseQueue } from 'common/store/queue/slice'
import { openWithDelay } from 'components/firstUploadModal/store/slice'
import Header from 'components/header/desktop/header'
import Page from 'components/page/page'
import { dropdownRows as stemRows } from 'components/sourceFilesModal/sourceFilesModal'
import { processFiles } from 'pages/uploadPage/store/utils/processFiles'
import * as schemas from 'schemas'
import { make } from 'store/analytics/actions'
import { contentListPage, albumPage, profilePage } from 'utils/route'

import styles from './uploadPage.module.css'
import EditPage from './components/editPage'
import FinishPage from './components/finishPage'
import SelectPage from './components/selectPage'
import UploadType from './components/uploadType'
import {
  uploadAgreements,
  reset,
  undoResetState,
  toggleMultiAgreementNotification
} from './store/actions'

const Pages = Object.freeze({
  SELECT: 0,
  EDIT: 1,
  FINISH: 2
})

const SHOW_FIRST_UPLOAD_MODAL_DELAY = 3000

const UploadPage = (props) => {
  const { children, page } = props

  return (
    <Spring
      key={page}
      from={{ opacity: 0.2 }}
      to={{ opacity: 1 }}
      config={{ duration: 200 }}
    >
      {(animProps) => (
        <div className={styles.upload} style={animProps}>
          <div className={styles.pageContent}>{children}</div>
        </div>
      )}
    </Spring>
  )
}

class Upload extends Component {
  state = {
    page: this.props.upload.uploading ? Pages.FINISH : Pages.SELECT,

    uploadType:
      this.props.uploadType ||
      this.props.upload.uploadType ||
      UploadType.INDIVIDUAL_AGREEMENT,

    agreements: this.props.upload.uploading ? this.props.upload.agreements : [],

    // Contains metadata related to the upload itself, e.g. contentList vs. agreement.
    metadata: this.props.upload.metadata
      ? this.props.upload.metadata
      : schemas.newCollectionMetadata({ artwork: { file: null, url: '' } }),

    // An array of array of agreements representing stems per agreement.
    stems: [],

    preview: null,
    previewIndex: -1,
    uploadAgreementError: null,
    isFirstUpload: false
  }

  componentDidUpdate() {
    if (this.state.preview !== null && this.props.playing) {
      this.stopPreview()
    }
    // If the account is defined and has 0 agreements and we haven't set isFirstUpload yet
    if (
      this.props.account &&
      !this.props.account.agreement_count &&
      !this.state.isFirstUpload
    ) {
      this.setState({ isFirstUpload: true })
    }

    // Reset the react state, then the store state if shouldReset is true and on Finished page
    if (this.props.upload.shouldReset) {
      if (this.state.page === Pages.FINISH) this.reset()
      this.props.undoResetState()
    }
  }

  componentWillUnmount() {
    if (this.state.preview) this.stopPreview()
    if (
      this.state.page !== Pages.FINISH ||
      (this.state.page === Pages.FINISH && !this.props.upload.uploading)
    ) {
      this.reset()
    }
  }

  changePage = (page) => {
    this.setState({
      page
    })
  }

  invalidAudioFile = (name, reason) => {
    this.setState({ uploadAgreementError: { reason } })
  }

  onSelectAgreements = async (selectedFiles) => {
    // Disallow duplicate agreements:
    // Filter out any agreements that already exist in `state.agreements`
    // and any that exist multiple times in `selectedFiles`
    const existing = new Set(
      this.state.agreements.map(({ file }) => `${file.name}-${file.lastModified}`)
    )
    selectedFiles = selectedFiles.filter(({ name, lastModified }) => {
      const id = `${name}-${lastModified}`
      if (existing.has(id)) return false
      existing.add(id)
      return true
    })

    const processedFiles = processFiles(
      selectedFiles,
      false,
      this.invalidAudioFile
    )
    const agreements = (await Promise.all(processedFiles)).filter(Boolean)
    if (agreements.length === processedFiles.length) {
      this.setState({ uploadAgreementError: null })
    }

    let uploadType = this.state.uploadType
    if (
      this.state.uploadType === UploadType.INDIVIDUAL_AGREEMENT &&
      this.state.agreements.length + agreements.length > 1
    ) {
      uploadType = UploadType.INDIVIDUAL_AGREEMENTS
    }

    this.setState({
      agreements: [...this.state.agreements, ...agreements],
      uploadType
    })
  }

  onAddStemsToAgreement = async (selectedStems, agreementIndex) => {
    const processedFiles = processFiles(
      selectedStems,
      true,
      this.invalidAudioFile
    )
    const stems = (await Promise.all(processedFiles))
      .filter(Boolean)
      .map((s) => ({
        ...s,
        category: stemRows[0],
        allowDelete: true,
        allowCategorySwitch: true
      }))
    this.setState((s) => {
      const newState = { ...s }
      newState.stems[agreementIndex] = [
        ...(newState.stems[agreementIndex] ?? []),
        ...stems
      ]
      return newState
    })
  }

  onDeleteStem = (agreementIndex, stemIndex) => {
    this.setState((s) => {
      const newState = { ...s }
      const newStems = [...newState.stems[agreementIndex]]
      newStems.splice(stemIndex, 1)
      newState.stems[agreementIndex] = newStems
      return newState
    })
  }

  onSelectStemCategory = (category, agreementIndex, stemIndex) => {
    this.setState((s) => {
      const newState = { ...s }
      newState.stems[agreementIndex][stemIndex].category = category
      return newState
    })
  }

  removeAgreement = (index) => {
    this.setState({
      agreements: this.state.agreements.filter((_, i) => i !== index),
      uploadType:
        this.state.agreements.length === 2
          ? UploadType.INDIVIDUAL_AGREEMENT
          : this.state.uploadType
    })
  }

  playPreview = (index) => {
    // Stop existing music if some is playing.
    if (this.props.playing) {
      this.props.pauseQueue()
    }

    if (this.state.preview) this.stopPreview()
    const live = this.state.agreements[index].preview
    live.play()
    this.setState({ preview: live, previewIndex: index })
  }

  stopPreview = () => {
    if (this.state.preview) {
      const preview = this.state.preview
      preview.pause()
      preview.currentTime = 0
    }
    this.setState({ preview: null, previewIndex: -1 })
  }

  updateAgreement = (field, value, i) => {
    if (i >= this.state.agreements.length) {
      return
    }
    const agreement = { ...this.state.agreements[i] }
    agreement.metadata[field] = value
    const newAgreements = [...this.state.agreements]
    newAgreements[i] = agreement
    this.setState({ agreements: newAgreements })
  }

  updateMetadata = (field, value) => {
    const metadata = { ...this.state.metadata }
    metadata[field] = value
    this.setState({ metadata })
  }

  publish = () => {
    this.props.uploadAgreements(
      this.state.agreements,
      this.state.metadata,
      this.state.uploadType,
      this.state.stems
    )
    this.changePage(Pages.FINISH)
  }

  reset = () => {
    this.setState({
      page: Pages.SELECT,
      agreements: [],
      preview: null,
      previewIndex: -1,
      uploadType: UploadType.INDIVIDUAL_AGREEMENT,
      metadata: schemas.newCollectionMetadata({
        artwork: { file: null, url: '' }
      }),
      uploadAgreementError: null
    })
    this.props.resetUpload()
  }

  setUploadType = (uploadType) => {
    this.setState({ uploadType })
  }

  onChangeOrder = (source, destination) => {
    const movedElement = this.state.agreements[source]
    const newAgreements = [...this.state.agreements]

    // Remove the element from it's source location
    newAgreements.splice(source, 1)

    // Put the moved guy back in
    newAgreements.splice(destination, 0, movedElement)

    this.setState({ agreements: newAgreements })
  }

  onVisitCompletionPage = () => {
    const {
      account,
      upload,
      goToRoute,
      openFirstUploadModal,
      onRecordViewCompletionPage
    } = this.props
    const { isFirstUpload } = this.state
    let route = ''
    let uploadType = ''
    if (upload.completionId) {
      switch (this.state.uploadType) {
        case UploadType.INDIVIDUAL_AGREEMENT: {
          route = upload.agreements[0].metadata.permalink
          uploadType = 'agreement'
          break
        }
        case UploadType.CONTENT_LIST: {
          const contentListName = upload.metadata.content_list_name
          route = contentListPage(
            account.handle,
            contentListName,
            upload.completionId
          )
          uploadType = 'contentList'
          break
        }
        case UploadType.ALBUM: {
          const albumName = upload.metadata.content_list_name
          route = albumPage(account.handle, albumName, upload.completionId)
          uploadType = 'album'
          break
        }
        default:
          break
      }
    } else {
      uploadType = 'agreements'
      route = profilePage(account.handle)
    }
    const areAnyPublic = upload.agreements.some((t) => !t.metadata.is_unlisted)
    if (isFirstUpload && areAnyPublic) {
      openFirstUploadModal(SHOW_FIRST_UPLOAD_MODAL_DELAY)
    }
    goToRoute(route)
    onRecordViewCompletionPage(uploadType)
  }

  render() {
    const {
      account,
      onCloseMultiAgreementNotification,
      upload: { uploadProgress, openMultiAgreementNotification, failedAgreementIndices }
    } = this.props
    const {
      page,
      agreements,
      metadata,
      uploadType,
      uploadAgreementError,
      isFirstUpload
    } = this.state

    // Only show errored agreements if we're not uploading
    // a collection
    const erroredAgreements =
      uploadType === UploadType.INDIVIDUAL_AGREEMENTS ? failedAgreementIndices : []

    let headerText
    if (uploadType === UploadType.INDIVIDUAL_AGREEMENTS) {
      headerText = 'Agreements'
    } else if (uploadType === UploadType.CONTENT_LIST) {
      headerText = 'ContentList'
    } else if (uploadType === UploadType.ALBUM) {
      headerText = 'Album'
    } else {
      headerText = 'Agreement'
    }

    let currentPage
    let header
    switch (page) {
      case Pages.SELECT:
        header = <Header primary={'Upload Agreements'} />
        currentPage = (
          <SelectPage
            account={account}
            agreements={agreements}
            error={uploadAgreementError}
            uploadType={uploadType}
            setUploadType={this.setUploadType}
            openMultiAgreementNotification={openMultiAgreementNotification}
            onCloseMultiAgreementNotification={onCloseMultiAgreementNotification}
            previewIndex={this.state.previewIndex}
            onSelect={this.onSelectAgreements}
            onRemove={this.removeAgreement}
            playPreview={this.playPreview}
            stopPreview={this.stopPreview}
            onContinue={() => this.changePage(Pages.EDIT)}
          />
        )
        break
      case Pages.EDIT:
        header = (
          <Header
            primary={`Complete Your ${headerText}`}
            showBackButton
            onClickBack={() => this.changePage(Pages.SELECT)}
          />
        )
        currentPage = (
          <EditPage
            metadata={metadata}
            agreements={agreements}
            uploadType={uploadType}
            previewIndex={this.state.previewIndex}
            onPlayPreview={this.playPreview}
            onStopPreview={this.stopPreview}
            updateAgreement={this.updateAgreement}
            updateMetadata={this.updateMetadata}
            onChangeOrder={this.onChangeOrder}
            onContinue={this.publish}
            onAddStems={this.onAddStemsToAgreement}
            onSelectStemCategory={this.onSelectStemCategory}
            stems={this.state.stems}
            onDeleteStem={this.onDeleteStem}
          />
        )
        break
      case Pages.FINISH: {
        const inProgress =
          this.props.upload.uploading || !this.props.upload.success
        const headerPrimary = inProgress
          ? `Complete Your ${headerText}`
          : 'Upload Complete'
        header = <Header primary={headerPrimary} />

        currentPage = (
          <FinishPage
            account={this.props.account ? this.props.account : {}}
            agreements={agreements}
            uploadProgress={uploadProgress}
            metadata={metadata}
            uploadType={uploadType}
            inProgress={inProgress}
            upload={this.props.upload}
            onContinue={this.onVisitCompletionPage}
            erroredAgreements={erroredAgreements}
            isFirstUpload={isFirstUpload}
          />
        )
        break
      }
      default:
        currentPage = null
        header = null
        break
    }
    return (
      <Page
        title='Upload'
        description='Upload and publish live content to the Coliving platform'
        contentClassName={styles.upload}
        header={header}
      >
        <UploadPage page={page}>{currentPage}</UploadPage>
      </Page>
    )
  }
}

const mapStateToProps = (state) => ({
  account: getAccountUser(state),
  upload: state.upload,
  playing: state.queue.playing
})

const mapDispatchToProps = (dispatch) => ({
  onRecordViewCompletionPage: (uploadType) =>
    dispatch(make(Name.AGREEMENT_UPLOAD_VIEW_AGREEMENT_PAGE, { uploadType })),
  goToRoute: (route) => dispatch(pushRoute(route)),
  undoResetState: () => dispatch(undoResetState()),
  pauseQueue: () => dispatch(pauseQueue({})),
  onCloseMultiAgreementNotification: () =>
    dispatch(toggleMultiAgreementNotification(false)),
  resetUpload: () => dispatch(reset()),
  uploadAgreements: (agreements, metadata, uploadType, stems) =>
    dispatch(uploadAgreements(agreements, metadata, uploadType, stems)),
  openFirstUploadModal: (delay) => dispatch(openWithDelay({ delay }))
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Upload))
