import { AppState } from 'store/types'

const getBase = (state: AppState) => state.application.ui.editContentListModal
export const getIsOpen = (state: AppState) => {
  return getBase(state).isOpen
}

export const getCollectionId = (state: AppState) => {
  return getBase(state).collectionId
}
