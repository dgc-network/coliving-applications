import { useEffect } from 'react'

import { ID, Status } from '@coliving/common'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import RemixSettingsModal from 'components/remix-settings-modal/RemixSettingsModal'
import { AppState } from 'store/types'

import { getAgreement, getUser, getStatus } from './store/selectors'
import { fetchAgreement, fetchAgreementSucceeded, reset } from './store/slice'

type OwnProps = {
  isOpen: boolean
  onClose: () => void
  // When opening the modal from a agreement that already has remix_of set,
  // the initial agreement id should be set to the first remix parent's agreement id.
  // This is used in the "edit agreement" flow.
  initialAgreementId?: ID
}

type ConnectedRemixSettingsModalProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedRemixSettingsModal = ({
  initialAgreementId,
  isOpen,
  onClose,
  agreement,
  user,
  status,
  setInitialAgreementId,
  reset,
  onEditUrl
}: ConnectedRemixSettingsModalProps) => {
  useEffect(() => {
    if (isOpen && initialAgreementId) {
      setInitialAgreementId(initialAgreementId)
    }
  }, [isOpen, initialAgreementId, setInitialAgreementId])

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
      agreement={agreement}
      user={user}
      isInvalidAgreement={status === Status.ERROR}
      onEditUrl={onEditUrl}
    />
  )
}

function mapStateToProps(state: AppState) {
  return {
    agreement: getAgreement(state),
    user: getUser(state),
    status: getStatus(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onEditUrl: (url: string) => dispatch(fetchAgreement({ url })),
    setInitialAgreementId: (agreementId: ID) =>
      dispatch(fetchAgreementSucceeded({ agreementId })),
    reset: () => dispatch(reset())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedRemixSettingsModal)
