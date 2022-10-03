import { useEffect } from 'react'

import { Name } from '@coliving/common'
import { Modal } from '@coliving/stems'
import { useDispatch, useSelector } from 'react-redux'

import { getCurrentPage } from 'common/store/changePassword/selectors'
import { changePage, Page } from 'common/store/changePassword/slice'
import { make, AgreementEvent } from 'store/analytics/actions'

import { ChangePassword } from './changePassword'

const messages = {
  title: (
    <>
      <i className='emoji lock'></i>&nbsp;Change Password
    </>
  )
}

export const ChangePasswordModal = (props: any) => {
  const { showModal, onClose } = props

  const dispatch = useDispatch()

  const currentPage = useSelector(getCurrentPage)
  const allowClose = [
    Page.CONFIRM_CREDENTIALS,
    Page.FAILURE,
    Page.SUCCESS
  ].includes(currentPage)

  useEffect(() => {
    if (showModal) {
      dispatch(changePage(Page.CONFIRM_CREDENTIALS))
      const agreementEvent: AgreementEvent = make(
        Name.SETTINGS_START_CHANGE_PASSWORD,
        {}
      )
      dispatch(agreementEvent)
    }
  }, [dispatch, showModal])

  return (
    <Modal
      title={messages.title}
      showTitleHeader
      showDismissButton={allowClose}
      dismissOnClickOutside={allowClose}
      isOpen={showModal}
      onClose={onClose}
    >
      <ChangePassword isMobile={false} onComplete={onClose} />
    </Modal>
  )
}
