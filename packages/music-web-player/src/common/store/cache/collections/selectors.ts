import {
  ID,
  UID,
  Collection,
  Kind,
  Status,
  DigitalContent,
  User,
  Uid
} from '@coliving/common'

import { CommonState } from 'common/store'
import { getAllEntries, getEntry } from 'common/store/cache/selectors'
import { getDigitalContents } from 'common/store/cache/digital_contents/selectors'
import {
  getUser as getUserById,
  getUsers
} from 'common/store/cache/users/selectors'

export const getCollection = (
  state: CommonState,
  props: { id?: ID | null; uid?: UID | null }
) => {
  return getEntry(state, {
    ...props,
    kind: Kind.COLLECTIONS
  })
}
export const getStatus = (state: CommonState, props: { id: ID }) =>
  state.collections.statuses[props.id] || null

export const getCollections = (
  state: CommonState,
  props?: { ids?: ID[] | null; uids?: UID[] | null }
) => {
  if (props && props.ids) {
    const collections: { [id: number]: Collection } = {}
    props.ids.forEach((id) => {
      const collection = getCollection(state, { id })
      if (collection) {
        collections[id] = collection
      }
    })
    return collections
  } else if (props && props.uids) {
    const collections: { [uid: string]: Collection } = {}
    props.uids.forEach((uid) => {
      const collection = getCollection(state, { uid })
      if (collection) {
        collections[collection.content_list_id] = collection
      }
    })
    return collections
  }
  return getAllEntries(state, { kind: Kind.COLLECTIONS })
}

export const getCollectionsByUid = (state: CommonState) => {
  return Object.keys(state.collections.uids).reduce((entries, uid) => {
    entries[uid] = getCollection(state, { uid })
    return entries
  }, {} as { [uid: string]: Collection | null })
}

export const getStatuses = (state: CommonState, props: { ids: ID[] }) => {
  const statuses: { [id: number]: Status } = {}
  props.ids.forEach((id) => {
    const status = getStatus(state, { id })
    if (status) {
      statuses[id] = status
    }
  })
  return statuses
}

export type EnhancedCollectionDigitalContent = DigitalContent & { user: User; uid: UID }
const emptyList: EnhancedCollectionDigitalContent[] = []
export const getDigitalContentsFromCollection = (
  state: CommonState,
  props: { uid: UID }
) => {
  const collection = getCollection(state, props)

  if (
    !collection ||
    !collection.content_list_contents ||
    !collection.content_list_contents.digital_content_ids
  )
    return emptyList

  const collectionSource = Uid.fromString(props.uid).source

  const ids = collection.content_list_contents.digital_content_ids.map((t) => t.digital_content)
  const digitalContents = getDigitalContents(state, { ids })

  const userIds = Object.keys(digitalContents)
    .map((id) => {
      const digital_content = digitalContents[id as unknown as number]
      if (digital_content?.owner_id) {
        return digital_content.owner_id
      }
      console.error(`Found empty digital_content ${id}, expected it to have an owner_id`)
      return null
    })
    .filter((userId) => userId !== null) as number[]
  const users = getUsers(state, { ids: userIds })

  if (!users || Object.keys(users).length === 0) return emptyList

  // Return digitalContents & rebuild UIDs for the digital_content so they refer directly to this collection
  return collection.content_list_contents.digital_content_ids
    .map((t, i) => {
      const digitalContentUid = Uid.fromString(t.uid ?? '')
      digitalContentUid.source = `${collectionSource}:${digitalContentUid.source}`
      digitalContentUid.count = i

      if (!digitalContents[t.digital_content]) {
        console.error(`Found empty digital_content ${t.digital_content}`)
        return null
      }
      return {
        ...digitalContents[t.digital_content],
        uid: digitalContentUid.toString(),
        user: users[digitalContents[t.digital_content].owner_id]
      }
    })
    .filter(Boolean) as EnhancedCollectionDigitalContent[]
}

type EnhancedCollection = Collection & { user: User }
export const getCollectionWithUser = (
  state: CommonState,
  props: { id?: ID }
): EnhancedCollection | null => {
  const collection = getCollection(state, { id: props.id })
  const userId = collection?.content_list_owner_id
  const user = getUserById(state, { id: userId })
  if (collection && user) {
    return {
      user,
      ...collection
    }
  }
  return null
}
