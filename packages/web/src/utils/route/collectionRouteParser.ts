import { ID } from '@coliving/common'
import { matchPath } from 'react-router-dom'

import { CONTENT_LIST_PAGE, ALBUM_PAGE, CONTENT_LIST_ID_PAGE } from 'utils/route'

import { decodeHashId } from './hashIds'

type CollectionRouteParams =
  | {
      collectionId: ID
      handle: string
      collectionType: 'content list' | 'album'
      title: string
    }
  | { collectionId: ID; handle: null; collectionType: null; title: null }
  | null

/**
 * Parses a collection route into handle, title, id, and type
 * If the route is a hash id route, title, handle, and type are not returned
 * @param route
 */
export const parseCollectionRoute = (route: string): CollectionRouteParams => {
  const collectionIdPageMatch = matchPath<{ id: string }>(route, {
    path: CONTENT_LIST_ID_PAGE,
    exact: true
  })
  if (collectionIdPageMatch) {
    const collectionId = decodeHashId(collectionIdPageMatch.params.id)
    if (collectionId === null) return null
    return { collectionId, handle: null, collectionType: null, title: null }
  }

  const content listPageMatch = matchPath<{
    handle: string
    content listName: string
  }>(route, {
    path: CONTENT_LIST_PAGE,
    exact: true
  })
  if (content listPageMatch) {
    const { handle, content listName } = content listPageMatch.params
    const nameParts = content listName.split('-')
    const title = nameParts.slice(0, nameParts.length - 1).join('-')
    const collectionId = parseInt(nameParts[nameParts.length - 1], 10)
    if (!collectionId || isNaN(collectionId)) return null
    return { title, collectionId, handle, collectionType: 'content list' }
  }

  const albumPageMatch = matchPath<{
    handle: string
    albumName: string
  }>(route, {
    path: ALBUM_PAGE,
    exact: true
  })
  if (albumPageMatch) {
    const { handle, albumName } = albumPageMatch.params
    const nameParts = albumName.split('-')
    const title = nameParts.slice(0, nameParts.length - 1).join('-')
    const collectionId = parseInt(nameParts[nameParts.length - 1], 10)
    if (!collectionId || isNaN(collectionId)) return null
    return { title, collectionId, handle, collectionType: 'album' }
  }

  return null
}
