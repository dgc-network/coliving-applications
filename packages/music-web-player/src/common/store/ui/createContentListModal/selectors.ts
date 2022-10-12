import { CommonState } from 'common/store'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getDigitalContents as getCachedDigitalContents } from 'common/store/cache/digital_contents/selectors'
import { getUsers } from 'common/store/cache/users/selectors'

export const getBaseState = (state: CommonState) => state.ui.createContentListModal

export const getIsOpen = (state: CommonState) => getBaseState(state).isOpen
export const getId = (state: CommonState) => getBaseState(state).collectionId
export const getHideFolderTab = (state: CommonState) =>
  getBaseState(state).hideFolderTab

export const getMetadata = (state: CommonState) => {
  const id = getId(state)
  if (!id) return null
  return getCollection(state, { id })
}

export const getDigitalContents = (state: CommonState) => {
  const metadata = getMetadata(state)
  if (!metadata) return null

  const digitalContentIds = metadata.content_list_contents.digital_content_ids.map((t) => t.digital_content)
  const digitalContents = getCachedDigitalContents(state, { ids: digitalContentIds })
  const userIds = Object.keys(digitalContents).map(
    (digitalContentId) => digitalContents[digitalContentId as unknown as number].owner_id
  )
  const users = getUsers(state, { ids: userIds })

  return digitalContentIds.map((id) => ({
    ...digitalContents[id],
    user: users[digitalContents[id].owner_id]
  }))
}
