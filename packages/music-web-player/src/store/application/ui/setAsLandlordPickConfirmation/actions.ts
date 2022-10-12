import { ID } from '@coliving/common'

// actions
export const SHOW_SET_AS_LANDLORD_PICK_CONFIRMATION = 'SET_AS_LANDLORD_PICK/SHOW'
export const HIDE_SET_AS_LANDLORD_PICK_CONFIRMATION = 'SET_AS_LANDLORD_PICK/HIDE'

// action creators
export const showSetAsLandlordPickConfirmation = (digitalContentId?: ID) => ({
  type: SHOW_SET_AS_LANDLORD_PICK_CONFIRMATION,
  digitalContentId
})

export const cancelSetAsLandlordPick = () => ({
  type: HIDE_SET_AS_LANDLORD_PICK_CONFIRMATION
})

export type ShowSetAsLandlordPickConfirmation = ReturnType<
  typeof showSetAsLandlordPickConfirmation
>
export type CancelSetAsLandlordPick = ReturnType<typeof cancelSetAsLandlordPick>

// action interfaces
export type SetAsLandlordPickConfirmationAction =
  | ShowSetAsLandlordPickConfirmation
  | CancelSetAsLandlordPick
