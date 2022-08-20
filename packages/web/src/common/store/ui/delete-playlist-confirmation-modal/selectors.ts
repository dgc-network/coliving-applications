import { CommonState } from 'common/store'

export const getContentListId = (state: CommonState) =>
  state.ui.deleteContentListConfirmationModal.contentListId
