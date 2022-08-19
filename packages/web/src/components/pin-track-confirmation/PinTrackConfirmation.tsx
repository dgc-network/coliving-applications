import { memo } from 'react'

import { ID } from '@coliving/common'
import { Modal, Button, ButtonSize, ButtonType } from '@coliving/stems'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getAccountUser } from 'common/store/account/selectors'
import {
  setArtistPick,
  unsetArtistPick
} from 'common/store/social/agreements/actions'
import { cancelSetAsArtistPick } from 'store/application/ui/setAsArtistPickConfirmation/actions'
import { getSetAsArtistPickConfirmation } from 'store/application/ui/setAsArtistPickConfirmation/selectors'
import { PinAgreementAction } from 'store/application/ui/setAsArtistPickConfirmation/types'
import { AppState } from 'store/types'

import styles from './PinAgreementConfirmation.module.css'

type PinAgreementConfirmationProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const pinAgreementActionMessages = {
  [PinAgreementAction.ADD]: {
    title: 'SET YOUR ARTIST PICK',
    description:
      'This agreement will appear at the top of your profile, above your recent uploads, until you change or remove it.',
    confirm: 'PICK AGREEMENT'
  },
  [PinAgreementAction.UPDATE]: {
    title: 'CHANGE YOUR ARTIST PICK?',
    description:
      'This agreement will appear at the top of your profile and replace your previously picked agreement.',
    confirm: 'CHANGE AGREEMENT'
  },
  [PinAgreementAction.REMOVE]: {
    title: 'UNSET AS ARTIST PICK',
    description: (
      <div className={styles.multiline}>
        <p>{'Are you sure you want to remove your pick?'}</p>
        <p>{'This agreement will be displayed based on its release date.'}</p>
      </div>
    ),
    confirm: 'UNSET AGREEMENT'
  }
}

const getMessages = (action?: PinAgreementAction) => {
  return {
    ...(action
      ? pinAgreementActionMessages[action]
      : { title: '', description: '', confirm: '' }),
    cancel: 'CANCEL'
  }
}

const PinAgreementConfirmation = (props: PinAgreementConfirmationProps) => {
  const { _artist_pick: artistPick } = props.user || { _artist_pick: null }
  const pinAction = !artistPick
    ? PinAgreementAction.ADD
    : props.pinAgreement.agreementId
    ? PinAgreementAction.UPDATE
    : PinAgreementAction.REMOVE
  const messages = getMessages(pinAction)

  const onConfirm = () => {
    props.setArtistPick(props.pinAgreement.agreementId)
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
      isOpen={props.pinAgreement.isVisible}
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

PinAgreementConfirmation.defaultProps = {
  visible: false
}

function mapStateToProps(state: AppState) {
  return {
    user: getAccountUser(state),
    pinAgreement: getSetAsArtistPickConfirmation(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onCancel: () => dispatch(cancelSetAsArtistPick()),
    setArtistPick: (agreementId?: ID) =>
      dispatch(agreementId ? setArtistPick(agreementId) : unsetArtistPick())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(PinAgreementConfirmation))
