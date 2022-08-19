import { CommonState } from 'common/store'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getAgreements as getCachedAgreements } from 'common/store/cache/agreements/selectors'
import { getUsers } from 'common/store/cache/users/selectors'

export const getBaseState = (state: CommonState) => state.ui.createPlaylistModal

export const getIsOpen = (state: CommonState) => getBaseState(state).isOpen
export const getId = (state: CommonState) => getBaseState(state).collectionId
export const getHideFolderTab = (state: CommonState) =>
  getBaseState(state).hideFolderTab

export const getMetadata = (state: CommonState) => {
  const id = getId(state)
  if (!id) return null
  return getCollection(state, { id })
}

export const getAgreements = (state: CommonState) => {
  const metadata = getMetadata(state)
  if (!metadata) return null

  const agreementIds = metadata.playlist_contents.agreement_ids.map((t) => t.agreement)
  const agreements = getCachedAgreements(state, { ids: agreementIds })
  const userIds = Object.keys(agreements).map(
    (agreementId) => agreements[agreementId as unknown as number].owner_id
  )
  const users = getUsers(state, { ids: userIds })

  return agreementIds.map((id) => ({
    ...agreements[id],
    user: users[agreements[id].owner_id]
  }))
}
