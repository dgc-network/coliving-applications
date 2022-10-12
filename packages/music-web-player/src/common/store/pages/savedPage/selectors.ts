import { ID } from '@coliving/common'

import { CommonState } from 'common/store'

export const getSaved = (state: CommonState) => state.pages.savedPage
export const getSaves = (state: CommonState) => state.pages.savedPage.saves
export const getLocalSaves = (state: CommonState) =>
  state.pages.savedPage.localSaves
export const getLocalSave = (state: CommonState, props: { id: ID }) =>
  state.pages.savedPage.localSaves[props.id]

export const getSavedDigitalContentsStatus = (state: CommonState) =>
  state.pages.savedPage.digitalContents.status
export const getSavedDigitalContentsLineup = (state: CommonState) =>
  state.pages.savedPage.digitalContents
export const getSavedDigitalContentsLineupUid = (
  state: CommonState,
  props: { id: ID }
) => {
  const digital_content = state.pages.savedPage.digitalContents.entries.find(
    // @ts-ignore
    (t) => t.id === props.id
  )
  return digital_content ? digital_content.uid : null
}
