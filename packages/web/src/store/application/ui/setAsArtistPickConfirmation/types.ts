import { ID } from '@coliving/common'

export enum PinAgreementAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  UPDATE = 'UPDATE'
}

export interface SetAsArtistPickConfirmationState {
  isVisible: boolean
  agreementId?: ID
}
