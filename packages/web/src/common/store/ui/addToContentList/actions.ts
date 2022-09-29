import { ID } from '@coliving/common'
import { createCustomAction } from 'typesafe-actions'

export const REQUEST_OPEN = 'ADD_TO_CONTENT_LIST/REQUEST_OPEN'
export const OPEN = 'ADD_TO_CONTENT_LIST/OPEN'
export const CLOSE = 'ADD_TO_CONTENT_LIST/CLOSE'

export const requestOpen = createCustomAction(
  REQUEST_OPEN,
  (agreementId: ID, agreementTitle: string) => ({ agreementId, agreementTitle })
)
export const open = createCustomAction(
  OPEN,
  (agreementId: ID, agreementTitle: string) => ({ agreementId, agreementTitle })
)
export const close = createCustomAction(CLOSE, () => {})
