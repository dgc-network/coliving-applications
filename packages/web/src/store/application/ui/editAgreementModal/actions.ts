import { ID } from '@coliving/common'

export const OPEN = 'APPLICATION/UI/EDIT_AGREEMENT_MODAL/OPEN'
export const CLOSE = 'APPLICATION/UI/EDIT_AGREEMENT_MODAL/CLOSE'

type OpenAction = { type: typeof OPEN; agreementId: ID }
type CloseAction = { type: typeof CLOSE }
export type EditAgreementModalActions = OpenAction | CloseAction

export const open = (agreementId: ID) => ({ type: OPEN, agreementId })
export const close = () => ({ type: CLOSE })
