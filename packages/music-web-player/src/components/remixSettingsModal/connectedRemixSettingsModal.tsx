import { useEffect } from 'react'

import { ID, Status } from '@coliving/common'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import RemixSettingsModal from 'components/remixSettingsModal/remixSettingsModal'
import { AppState } from 'store/types'

import { getDigitalContent, getUser, getStatus } from './store/selectors'
import { fetchDigitalContent, fetchDigitalContentSucceeded, reset } from './store/slice'

type OwnProps = {
  isOpen: boolean
  onClose: () => void
  // When opening the modal from a digital_content that already has remix_of set,
  // the initial digital_content id should be set to the first remix parent's digital_content id.
  // This is used in the "edit digital_content" flow.
  initialDigitalContentId?: ID
}

type ConnectedRemixSettingsModalProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedRemixSettingsModal = ({
  initialDigitalContentId,
  isOpen,
  onClose,
  digital_content,
  user,
  status,
  setInitialDigitalContentId,
  reset,
  onEditUrl
}: ConnectedRemixSettingsModalProps) => {
  useEffect(() => {
    if (isOpen && initialDigitalContentId) {
      setInitialDigitalContentId(initialDigitalContentId)
    }
  }, [isOpen, initialDigitalContentId, setInitialDigitalContentId])

  // Reset the connected modal state as soon as it closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  return (
    <RemixSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      digital_content={digital_content}
      user={user}
      isInvalidDigitalContent={status === Status.ERROR}
      onEditUrl={onEditUrl}
    />
  )
}

function mapStateToProps(state: AppState) {
  return {
    digital_content: getDigitalContent(state),
    user: getUser(state),
    status: getStatus(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onEditUrl: (url: string) => dispatch(fetchDigitalContent({ url })),
    setInitialDigitalContentId: (digitalContentId: ID) =>
      dispatch(fetchDigitalContentSucceeded({ digitalContentId })),
    reset: () => dispatch(reset())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedRemixSettingsModal)
