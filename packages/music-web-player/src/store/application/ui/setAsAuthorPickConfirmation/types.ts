import { ID } from '@coliving/common'

export enum PinDigitalContentAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  UPDATE = 'UPDATE'
}

export interface SetAsLandlordPickConfirmationState {
  isVisible: boolean
  digitalContentId?: ID
}
