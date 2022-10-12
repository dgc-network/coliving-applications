import {
  ID,
  ContentListLibrary,
  ContentListLibraryIdentifier,
  ContentListLibraryFolder,
  SmartCollectionVariant,
  uuid
} from '@coliving/common'
import isEmpty from 'lodash/isEmpty'

import { AccountCollection } from '../account/reducer'

/**
 * Finds a contentList by id in the contentList library
 * @param library
 * @param contentListId
 * @returns the identifier or false
 */
export const findInContentListLibrary = (
  library: ContentListLibrary | ContentListLibraryFolder,
  contentListId: ID | SmartCollectionVariant | string
): ContentListLibraryIdentifier | false => {
  if (!library.contents) return false

  // Simple DFS (this likely is very small, so this is fine)
  for (const item of library.contents) {
    switch (item.type) {
      case 'folder': {
        const contains = findInContentListLibrary(item, contentListId)
        if (contains) return contains
        break
      }
      case 'contentList':
      case 'explore_content_list':
      case 'temp_content_list':
        if (item.content_list_id === contentListId) return item
        break
    }
  }
  return false
}

/**
 * Finds the index of a contentList or folder id in the library, returning -1 if not found
 * If the target item is nested in a folder, this returns a tuple where the first value is the
 * index of the folder and the second value is the index of the item within that folder's contents.
 * @param library
 * @param entityId
 * @returns {number | number[] | false}
 */
export const findIndexInContentListLibrary = (
  library: ContentListLibrary | ContentListLibraryFolder,
  entityId: ID | SmartCollectionVariant | string
): number | number[] | -1 => {
  if (!library.contents) return -1

  // Simple DFS (this likely is very small, so this is fine)
  for (const [i, item] of library.contents.entries()) {
    switch (item.type) {
      case 'folder': {
        if (item.id === entityId) return i
        const indexInFolder = findIndexInContentListLibrary(item, entityId)
        if (indexInFolder !== -1) {
          return [i].concat(indexInFolder)
        }
        break
      }
      case 'contentList':
      case 'explore_content_list':
      case 'temp_content_list':
        if (item.content_list_id === entityId) return i
        break
    }
  }
  return -1
}

/**
 * Removes a contentList or folder from the library and returns the removed item as well as the
 * updated library (does not mutate)
 * @param library
 * @param entityId the id of the contentList or folder to remove
 * @returns { library, removed }
 */
export const removeFromContentListLibrary = (
  library: ContentListLibrary | ContentListLibraryFolder,
  entityId: ID | SmartCollectionVariant | string
): {
  library: ContentListLibrary | ContentListLibraryFolder
  removed: ContentListLibraryIdentifier | ContentListLibraryFolder | null
} => {
  if (!library.contents) return { library, removed: null }

  const newContents: (ContentListLibraryFolder | ContentListLibraryIdentifier)[] = []
  let removed: ContentListLibraryIdentifier | ContentListLibraryFolder | null = null
  for (const item of library.contents) {
    let newItem: ContentListLibraryFolder | ContentListLibraryIdentifier | null = item
    switch (item.type) {
      case 'folder': {
        if (item.id === entityId) {
          removed = item
          newItem = null
        } else {
          const res = removeFromContentListLibrary(item, entityId)
          if (res.removed) {
            removed = res.removed
          }
          newItem = {
            id: item.id,
            type: item.type,
            name: item.name,
            contents: res.library.contents
          }
        }
        break
      }
      case 'contentList':
      case 'explore_content_list':
      case 'temp_content_list':
        if (item.content_list_id === entityId) {
          removed = item
          newItem = null
        }
        break
    }
    if (newItem) {
      newContents.push(newItem)
    }
  }
  return {
    library: {
      ...library,
      contents: newContents
    },
    removed
  }
}

export const constructContentListFolder = (
  name: string,
  contents: (ContentListLibraryFolder | ContentListLibraryIdentifier)[] = []
): ContentListLibraryFolder => {
  return {
    id: uuid(),
    type: 'folder',
    name,
    contents
  }
}

const contentListIdToContentListLibraryIdentifier = (
  contentListId: ID | SmartCollectionVariant | string
): ContentListLibraryIdentifier => {
  if (typeof contentListId === 'number') {
    return {
      type: 'contentList',
      content_list_id: contentListId
    }
  } else if (
    (Object.values(SmartCollectionVariant) as string[]).includes(contentListId)
  ) {
    return {
      type: 'explore_content_list',
      content_list_id: contentListId as SmartCollectionVariant
    }
  } else {
    // This is a temp ID which requires special attention
    return {
      type: 'temp_content_list',
      content_list_id: contentListId
    }
  }
}

/**
 * Adds contentList with given id to folder with given id and returns the resulting updated library.
 * If the contentList is already in the library but not in the folder, it removes the contentList from its current position and into the folder.
 * This is a no op if the folder is not in the library or the contentList is already in the target folder. In these cases, the original library is returned.
 * @param library
 * @param contentListId
 * @param folderId
 * @returns the updated contentList library
 */
export const addContentListToFolder = (
  library: ContentListLibrary,
  contentListId: ID | SmartCollectionVariant | string,
  folderId: string
): ContentListLibrary => {
  if (!library.contents) return library
  let folderIndex = library.contents.findIndex((item) => {
    return item.type === 'folder' && item.id === folderId
  })
  if (folderIndex < 0) return library
  const folder = library.contents[folderIndex] as ContentListLibraryFolder
  // If the contentList is in the right folder already, return the original library.
  if (findInContentListLibrary(folder, contentListId) !== false) {
    return library
  }

  // Remove the contentList from the library if it's already there but not in the given folder
  let entry: ContentListLibraryIdentifier | null
  const { library: newLibrary, removed } = removeFromContentListLibrary(
    library,
    contentListId
  )

  if (removed?.type === 'folder') {
    // Shouldn't hit this but this enforces the right type for `removed`
    return library
  }
  entry = removed as ContentListLibraryIdentifier

  if (!entry) {
    entry = contentListIdToContentListLibraryIdentifier(contentListId)
  } else {
    // If contentList was removed the folder index might be different now.
    folderIndex = newLibrary.contents.findIndex((item) => {
      return item.type === 'folder' && item.id === folderId
    })
  }
  const updatedFolder = reorderContentListLibrary(
    folder,
    contentListId,
    -1
  ) as ContentListLibraryFolder
  const newContents = [...newLibrary.contents]

  newContents.splice(folderIndex, 1, updatedFolder)

  return {
    ...newLibrary,
    contents: newContents
  }
}

/**
 * Changes name of folder with given id to the given new name and returns the resulting
 * updated library. Does not mutate the given library object.
 * Note that this assumes that folders cannot be nested within one another.
 * If we enable nesting folders in the future, this function must be updated.
 * @param library
 * @param folderId
 * @param newName
 * @returns the updated contentList library
 */
export const renameContentListFolderInLibrary = (
  library: ContentListLibrary,
  folderId: string,
  newName: string
): ContentListLibrary => {
  if (!library.contents) return library
  const folderIndex = library.contents.findIndex((item) => {
    return item.type === 'folder' && item.id === folderId
  })
  if (folderIndex < 0) return library
  const folder = library.contents[folderIndex]
  const updatedFolder = { ...folder, name: newName }
  const newContents = [...library.contents]
  newContents.splice(folderIndex, 1, updatedFolder)
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Removes folder with given id from the library.
 * Any contentLists or temporary contentLists in the deleted
 * folder are moved out of the folder.
 * Note that this assumes that folders cannot be nested within one another.
 * If we enable nesting folders in the future, this function must be updated.
 * @param library
 * @param folderId
 * @returns the updated contentList library
 */
export const removeContentListFolderInLibrary = (
  library: ContentListLibrary,
  folderId: string
): ContentListLibrary => {
  if (!library.contents) return library
  const folder = library.contents.find((item) => {
    return item.type === 'folder' && item.id === folderId
    // Need to cast here because TS doesn't know that the result has to be a folder or undefined due to `item.type === 'folder'`
  }) as ContentListLibraryFolder | undefined
  if (!folder) return library
  const folderIndex = library.contents.findIndex((item) => {
    return item.type === 'folder' && item.id === folderId
  })
  const newContents = [...library.contents]
  // Move contents of folder out
  const removedFolderContents = folder.contents
  newContents.splice(folderIndex, 1, ...removedFolderContents)
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Adds new folder to a contentList library and returns the result.
 * Does not mutate.
 * @param library
 * @param folder
 */
export const addFolderToLibrary = (
  library: ContentListLibrary | null,
  folder: ContentListLibraryFolder
): ContentListLibrary => {
  return {
    ...(library || {}),
    contents: [...(library?.contents || []), folder]
  }
}

/**
 * Removes temp contentLists from contentList library (without mutating)
 * @param library
 * @returns a copy of the library with all temp contentLists removed
 */
export const removeContentListLibraryTempContentLists = (
  library: ContentListLibrary | ContentListLibraryFolder
) => {
  if (!library.contents) return library
  const newContents: (ContentListLibraryFolder | ContentListLibraryIdentifier)[] = []
  for (const item of library.contents) {
    switch (item.type) {
      case 'folder': {
        const folder = removeContentListLibraryTempContentLists(
          item
        ) as ContentListLibraryFolder
        newContents.push(folder)
        break
      }
      case 'temp_content_list':
        break
      case 'explore_content_list':
      case 'contentList':
        newContents.push(item)
        break
    }
  }
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Removes duplicates in a contentList library
 * @param library
 * @param ids ids to keep digital_content of as we recurse
 */
export const removeContentListLibraryDuplicates = (
  library: ContentListLibrary | ContentListLibraryFolder,
  ids: Set<string> = new Set([])
) => {
  if (!library.contents) return library
  const newContents: (ContentListLibraryFolder | ContentListLibraryIdentifier)[] = []

  // Simple DFS (this likely is very small, so this is fine)
  for (const item of library.contents) {
    switch (item.type) {
      case 'folder': {
        // If we've seen this folder already, don't include it in our final result.
        if (ids.has(item.id)) {
          break
        }
        ids.add(item.id)
        const folder = removeContentListLibraryDuplicates(
          item,
          ids
        ) as ContentListLibraryFolder
        newContents.push(folder)
        break
      }
      case 'contentList':
      case 'explore_content_list':
      case 'temp_content_list':
        // If we've seen this contentList already, don't include it in our final result.
        if (ids.has(`${item.content_list_id}`)) {
          break
        }
        ids.add(`${item.content_list_id}`)
        newContents.push(item)
        break
    }
  }
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Reorders a contentList library
 * Note that this helper assumes that folders cannot be inside folders.
 * If we ever support nesting folders, this must be updated.
 * @param library
 * @param draggingId the contentList being reordered
 * @param droppingId the contentList where the dragged one was dropped onto
 */
export const reorderContentListLibrary = (
  library: ContentListLibrary | ContentListLibraryFolder,
  draggingId: ID | SmartCollectionVariant | string,
  droppingId: ID | SmartCollectionVariant | string,
  draggingKind:
    | 'library-content-list'
    | 'contentList'
    | 'content-list-folder' = 'library-content-list',
  reorderBeforeTarget = false
) => {
  // Find the dragging id and remove it from the library if present.
  let entry: ContentListLibraryIdentifier | ContentListLibraryFolder | null
  const { library: newLibrary, removed } = removeFromContentListLibrary(
    library,
    draggingId
  )
  entry = removed
  if (!entry) {
    if (draggingKind === 'content-list-folder') {
      // Soft fail if the thing being dragged is a folder and it doesn't exist in the library yet. This shouldn't be possible.
      return library
    } else {
      entry = contentListIdToContentListLibraryIdentifier(draggingId)
    }
  }

  const newContents = [...newLibrary.contents]

  let index: number | number[]
  // We are dropping to the top
  if (droppingId === -1) {
    index = 0
  } else {
    // Find the droppable id and place the draggable id after it
    const found = findIndexInContentListLibrary(newLibrary, droppingId)
    if (found === -1) return library
    const indexShift = reorderBeforeTarget ? 0 : 1
    if (Array.isArray(found)) {
      index = [found[0], found[1] + indexShift]
    } else {
      index = found + indexShift
    }
  }
  if (Array.isArray(index)) {
    // The lines below assumes that folders cannot be nested inside folders; that is, that the
    // dropId will only ever be up to one level deep.
    // This must be updated if we ever allow nested folders.
    const folderIndex = index[0]
    const dropIndex = index[1]
    const folder = newContents[folderIndex] as ContentListLibraryFolder
    const updatedFolderContents = [...folder.contents]
    updatedFolderContents.splice(dropIndex, 0, entry)
    const updatedFolder = { ...folder, contents: updatedFolderContents }
    newContents.splice(folderIndex, 1, updatedFolder)
  } else {
    newContents.splice(index, 0, entry)
  }
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Determines whether or not a library contains a temp contentList
 * @param library
 * @returns boolean
 */
export const containsTempContentList = (
  library: ContentListLibrary | ContentListLibraryFolder
): boolean => {
  if (!library.contents) return false

  // Simple DFS (this likely is very small, so this is fine)
  for (const item of library.contents) {
    switch (item.type) {
      case 'folder': {
        const contains = containsTempContentList(item)
        if (contains) return contains
        break
      }
      case 'temp_content_list':
        return true
      default:
        break
    }
  }
  return false
}

/**
 * Determines whether or not a contentList or folder is inside a folder
 * @param library
 * @param id (contentList or folder id)
 * @returns boolean
 */
export const isInsideFolder = (
  library: ContentListLibrary | ContentListLibraryFolder,
  id: ID | string | SmartCollectionVariant
): boolean => {
  return Array.isArray(findIndexInContentListLibrary(library, id))
}

/**
 * Takes a library and returns a list of all temporary contentLists from that library
 * @param library
 * @returns ContentListLibraryIdentifier[]
 */
export const extractTempContentListsFromLibrary = (
  library: ContentListLibrary | ContentListLibraryFolder
): ContentListLibraryIdentifier[] => {
  if (isEmpty(library.contents)) return []
  return library.contents.reduce((prevResult, nextContent) => {
    if (nextContent.type === 'folder') {
      return prevResult.concat(extractTempContentListsFromLibrary(nextContent))
    } else if (nextContent.type === 'temp_content_list') {
      return prevResult.concat(nextContent)
    } else {
      return prevResult
    }
  }, [] as ContentListLibraryIdentifier[])
}

/**
 * Takes a library and mapping of temporary contentList ids to their resolved
 * contentList identifiers, then returns the library (does not mutate original)
 * with temporary contentLists replaced by their resolved contentList identifiers.
 * @param library
 * @param tempContentListIdToResolvedContentList object that maps temporary contentList ids to their resolved contentList identifiers
 * @returns ContentListLibrary | ContentListLibraryFolder
 */
export const replaceTempWithResolvedContentLists = <
  T extends ContentListLibrary | ContentListLibraryFolder
>(
  library: T,
  tempContentListIdToResolvedContentList: Record<string, ContentListLibraryIdentifier>
): T => {
  if (isEmpty(library.contents)) return library
  const newContents = library.contents.map((c) => {
    if (c.type === 'folder') {
      return replaceTempWithResolvedContentLists(
        c,
        tempContentListIdToResolvedContentList
      )
    } else if (c.type === 'temp_content_list') {
      return tempContentListIdToResolvedContentList[c.content_list_id] ?? c
    } else {
      return c
    }
  })
  return { ...library, contents: newContents }
}

/* Returns contentLists in `contentLists` that are not in the given contentList library `library`. */
export const getContentListsNotInLibrary = (
  library: ContentListLibrary | null,
  contentLists: {
    [id: number]: AccountCollection
  }
) => {
  const result = { ...contentLists }
  const helpComputeContentListsNotInLibrary = (
    libraryContentsLevel: ContentListLibrary['contents']
  ) => {
    libraryContentsLevel.forEach((content) => {
      if (content.type === 'temp_content_list' || content.type === 'contentList') {
        const contentList = contentLists[Number(content.content_list_id)]
        if (contentList) {
          delete result[Number(content.content_list_id)]
        }
      } else if (content.type === 'folder') {
        helpComputeContentListsNotInLibrary(content.contents)
      }
    })
  }
  if (library && contentLists) {
    helpComputeContentListsNotInLibrary(library.contents)
  }
  return result
}
