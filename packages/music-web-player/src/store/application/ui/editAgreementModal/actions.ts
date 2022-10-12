import { ID } from '@coliving/common'

export const OPEN = 'APPLICATION/UI/EDIT_AGREEMENT_MODAL/OPEN'
export const CLOSE = 'APPLICATION/UI/EDIT_AGREEMENT_MODAL/CLOSE'

type OpenAction = { type: typeof OPEN; digitalContentId: ID }
type CloseAction = { type: typeof CLOSE }
export type EditDigitalContentModalActions = OpenAction | CloseAction

export const open = (digitalContentId: ID) => ({ type: OPEN, digitalContentId })
export const close = () => ({ type: CLOSE })
