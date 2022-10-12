import {
  UserCollectionMetadata,
  UserDigitalContentMetadata,
  UserMetadata,
  removeNullable
} from '@coliving/common'

import * as adapter from './responseAdapter'
import { APIResponse, APISearch } from './types'

const SEARCH_MAX_SAVED_RESULTS = 10
const SEARCH_MAX_TOTAL_RESULTS = 50

const AUTOCOMPLETE_MAX_SAVED_RESULTS = 2
const AUTOCOMPLETE_TOTAL_RESULTS = 3

/**
 * Combines two lists by concatting `maxSaved` results from the `savedList` onto the head of `normalList`,
 * ensuring that no item is duplicated in the resulting list (deduped by `uniqueKey`). The final list length is capped
 * at `maxTotal` items.
 */
const combineLists = (
  savedList: Array<Record<string, any>>,
  normalList: Array<Record<string, any>>,
  uniqueKey: string,
  maxSaved: number,
  maxTotal: number
) => {
  const truncatedSavedList = savedList.slice(
    0,
    Math.min(maxSaved, savedList.length)
  )
  const saveListsSet = new Set(truncatedSavedList.map((s) => s[uniqueKey]))
  const filteredList = normalList.filter((n) => !saveListsSet.has(n[uniqueKey]))
  const combinedLists = savedList.concat(filteredList)
  return combinedLists.slice(0, Math.min(maxTotal, combinedLists.length))
}

type ProcessSearchResultsArgs = {
  digitalContents?: UserDigitalContentMetadata[]
  albums?: UserCollectionMetadata[]
  contentLists?: UserCollectionMetadata[]
  users?: UserMetadata[]
  saved_digital_contents?: UserDigitalContentMetadata[]
  saved_albums?: UserCollectionMetadata[]
  saved_content_lists?: UserCollectionMetadata[]
  followed_users?: UserMetadata[]
  searchText?: string | null
  isAutocomplete?: boolean
}

export const adaptSearchResponse = (searchResponse: APIResponse<APISearch>) => {
  return {
    digitalContents:
      searchResponse.data.digitalContents
        ?.map(adapter.makeDigitalContent)
        .filter(removeNullable) ?? undefined,
    saved_digital_contents:
      searchResponse.data.saved_digital_contents
        ?.map(adapter.makeDigitalContent)
        .filter(removeNullable) ?? undefined,
    users:
      searchResponse.data.users?.map(adapter.makeUser).filter(removeNullable) ??
      undefined,
    followed_users:
      searchResponse.data.followed_users
        ?.map(adapter.makeUser)
        .filter(removeNullable) ?? undefined,
    contentLists:
      searchResponse.data.contentLists
        ?.map(adapter.makeContentList)
        .filter(removeNullable) ?? undefined,
    saved_content_lists:
      searchResponse.data.saved_content_lists
        ?.map(adapter.makeContentList)
        .filter(removeNullable) ?? undefined,
    albums:
      searchResponse.data.albums
        ?.map(adapter.makeContentList)
        .filter(removeNullable) ?? undefined,
    saved_albums:
      searchResponse.data.saved_albums
        ?.map(adapter.makeContentList)
        .filter(removeNullable) ?? undefined
  }
}
export const processSearchResults = async ({
  digitalContents = [],
  albums = [],
  contentLists = [],
  users = [],
  saved_digital_contents: savedDigitalContents = [],
  saved_albums: savedAlbums = [],
  saved_content_lists: savedContentLists = [],
  followed_users: followedUsers = [],
  isAutocomplete = false
}: ProcessSearchResultsArgs) => {
  const maxSaved = isAutocomplete
    ? AUTOCOMPLETE_MAX_SAVED_RESULTS
    : SEARCH_MAX_SAVED_RESULTS
  const maxTotal = isAutocomplete
    ? AUTOCOMPLETE_TOTAL_RESULTS
    : SEARCH_MAX_TOTAL_RESULTS
  const combinedDigitalContents = combineLists(
    savedDigitalContents,
    digitalContents,
    'digital_content_id',
    maxSaved,
    maxTotal
  )
  const combinedAlbums = combineLists(
    savedAlbums,
    albums,
    'content_list_id',
    maxSaved,
    maxTotal
  )
  const combinedContentLists = combineLists(
    savedContentLists,
    contentLists,
    'content_list_id',
    maxSaved,
    maxTotal
  )
  const combinedUsers = combineLists(
    followedUsers,
    users,
    'user_id',
    maxSaved,
    maxTotal
  )

  return {
    digitalContents: combinedDigitalContents,
    albums: combinedAlbums,
    contentLists: combinedContentLists,
    users: combinedUsers
  }
}
