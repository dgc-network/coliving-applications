import { ID } from '@coliving/common'
export const OPEN = 'APPLICATION/UI/CREATE_CONTENT_LIST_MODAL/OPEN'
export const CLOSE = 'APPLICATION/UI/CREATE_CONTENT_LIST_MODAL/CLOSE'

export const open = (collectionId?: ID, hideFolderTab = false) => ({
  type: OPEN,
  collectionId,
  hideFolderTab
})
export const close = () => ({ type: CLOSE })
