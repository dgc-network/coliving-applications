import { ID } from '@coliving/common'

import { CommonState } from 'common/store'

export const getSaved = (state: CommonState) => state.pages.savedPage
export const getSaves = (state: CommonState) => state.pages.savedPage.saves
export const getLocalSaves = (state: CommonState) =>
  state.pages.savedPage.localSaves
export const getLocalSave = (state: CommonState, props: { id: ID }) =>
  state.pages.savedPage.localSaves[props.id]

export const getSavedAgreementsStatus = (state: CommonState) =>
  state.pages.savedPage.agreements.status
export const getSavedAgreementsLineup = (state: CommonState) =>
  state.pages.savedPage.agreements
export const getSavedAgreementsLineupUid = (
  state: CommonState,
  props: { id: ID }
) => {
  const agreement = state.pages.savedPage.agreements.entries.find(
    // @ts-ignore
    (t) => t.id === props.id
  )
  return agreement ? agreement.uid : null
}
