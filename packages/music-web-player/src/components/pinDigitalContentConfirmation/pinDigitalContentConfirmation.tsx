import { memo } from 'react'

import { ID } from '@coliving/common'
import { Modal, Button, ButtonSize, ButtonType } from '@coliving/stems'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getAccountUser } from 'common/store/account/selectors'
import {
  setLandlordPick,
  unsetLandlordPick
} from 'common/store/social/digital_contents/actions'
import { cancelSetAsLandlordPick } from 'store/application/ui/setAsAuthorPickConfirmation/actions'
import { getSetAsLandlordPickConfirmation } from 'store/application/ui/setAsAuthorPickConfirmation/selectors'
import { PinDigitalContentAction } from 'store/application/ui/setAsAuthorPickConfirmation/types'
import { AppState } from 'store/types'

import styles from './PinDigitalContentConfirmation.module.css'

type PinDigitalContentConfirmationProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const pinDigitalContentActionMessages = {
  [PinDigitalContentAction.ADD]: {
    title: 'SET YOUR LANDLORD PICK',
    description:
      'This digital_content will appear at the top of your profile, above your recent uploads, until you change or remove it.',
    confirm: 'PICK AGREEMENT'
  },
  [PinDigitalContentAction.UPDATE]: {
    title: 'CHANGE YOUR LANDLORD PICK?',
    description:
      'This digital_content will appear at the top of your profile and replace your previously picked digital_content.',
    confirm: 'CHANGE AGREEMENT'
  },
  [PinDigitalContentAction.REMOVE]: {
    title: 'UNSET AS LANDLORD PICK',
    description: (
      <div className={styles.multiline}>
        <p>{'Are you sure you want to remove your pick?'}</p>
        <p>{'This digital_content will be displayed based on its release date.'}</p>
      </div>
    ),
    confirm: 'UNSET AGREEMENT'
  }
}

const getMessages = (action?: PinDigitalContentAction) => {
  return {
    ...(action
      ? pinDigitalContentActionMessages[action]
      : { title: '', description: '', confirm: '' }),
    cancel: 'CANCEL'
  }
}

const PinDigitalContentConfirmation = (props: PinDigitalContentConfirmationProps) => {
  const { _landlord_pick: landlordPick } = props.user || { _landlord_pick: null }
  const pinAction = !landlordPick
    ? PinDigitalContentAction.ADD
    : props.pinDigitalContent.digitalContentId
    ? PinDigitalContentAction.UPDATE
    : PinDigitalContentAction.REMOVE
  const messages = getMessages(pinAction)

  const onConfirm = () => {
    props.setLandlordPick(props.pinDigitalContent.digitalContentId)
    props.onCancel()
  }

  return (
    <Modal
      title={messages.title}
      showTitleHeader
      showDismissButton
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.modalHeader}
      titleClassName={styles.modalTitle}
      isOpen={props.pinDigitalContent.isVisible}
      onClose={props.onCancel}
    >
      <div className={styles.container}>
        <div className={styles.description}>{messages.description}</div>
        <div className={styles.buttons}>
          <Button
            className={styles.deleteButton}
            text={messages.cancel}
            size={ButtonSize.MEDIUM}
            type={ButtonType.COMMON}
            onClick={props.onCancel}
          />
          <Button
            className={styles.nevermindButton}
            text={messages.confirm}
            size={ButtonSize.MEDIUM}
            type={ButtonType.PRIMARY_ALT}
            onClick={onConfirm}
          />
        </div>
      </div>
    </Modal>
  )
}

PinDigitalContentConfirmation.defaultProps = {
  visible: false
}

function mapStateToProps(state: AppState) {
  return {
    user: getAccountUser(state),
    pinDigitalContent: getSetAsLandlordPickConfirmation(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onCancel: () => dispatch(cancelSetAsLandlordPick()),
    setLandlordPick: (digitalContentId?: ID) =>
      dispatch(digitalContentId ? setLandlordPick(digitalContentId) : unsetLandlordPick())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(PinDigitalContentConfirmation))
