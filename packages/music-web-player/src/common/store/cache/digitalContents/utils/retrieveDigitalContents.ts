import {
  ID,
  Kind,
  Status,
  DigitalContent,
  DigitalContentMetadata,
  UserDigitalContentMetadata
} from '@coliving/common'
import { call, put, select, spawn } from 'typed-redux-saga/macro'

import { CommonState } from 'common/store'
import { getUserId } from 'common/store/account/selectors'
import { retrieve } from 'common/store/cache/sagas'
import { getEntryTimestamp } from 'common/store/cache/selectors'
import * as digitalContentActions from 'common/store/cache/digital_contents/actions'
import { getDigitalContents as getDigitalContentsSelector } from 'common/store/cache/digital_contents/selectors'
import ColivingBackend from 'services/colivingBackend'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

import { setDigitalContentsIsBlocked } from './blocklist'
import {
  fetchAndProcessRemixes,
  fetchAndProcessRemixParents
} from './fetchAndProcessRemixes'
import { fetchAndProcessStems } from './fetchAndProcessStems'
import { addUsersFromDigitalContents } from './helpers'
import { reformat } from './reformat'

type UnlistedDigitalContentRequest = { id: ID; url_title: string; handle: string }
type RetrieveDigitalContentsArgs = {
  digitalContentIds: ID[] | UnlistedDigitalContentRequest[]
  canBeUnlisted?: boolean
  withStems?: boolean
  withRemixes?: boolean
  withRemixParents?: boolean
  forceRetrieveFromSource?: boolean
}
type RetrieveDigitalContentByHandleAndSlugArgs = {
  handle: string
  slug: string
  withStems?: boolean
  withRemixes?: boolean
  withRemixParents?: boolean
}

export function* retrieveDigitalContentByHandleAndSlug({
  handle,
  slug,
  withStems,
  withRemixes,
  withRemixParents
}: RetrieveDigitalContentByHandleAndSlugArgs) {
  const permalink = `/${handle}/${slug}`
  const digitalContents: { entries: { [permalink: string]: DigitalContent } } = yield* call(
    // @ts-ignore retrieve should be refactored to ts first
    retrieve,
    {
      ids: [permalink],
      selectFromCache: function* (permalinks: string[]) {
        const digital_content = yield* select(getDigitalContentsSelector, {
          permalinks
        })
        return digital_content
      },
      retrieveFromSource: function* (permalinks: string[]) {
        const userId = yield* select(getUserId)
        const digital_content = yield* call((args) => {
          const split = args[0].split('/')
          const handle = split[1]
          const slug = split.slice(2).join('')
          return apiClient.getDigitalContentByHandleAndSlug({
            handle,
            slug,
            currentUserId: userId
          })
        }, permalinks)
        return digital_content
      },
      kind: Kind.AGREEMENTS,
      idField: 'digital_content_id',
      forceRetrieveFromSource: false,
      shouldSetLoading: true,
      deleteExistingEntry: false,
      getEntriesTimestamp: function* (ids: ID[]) {
        const selected = yield* select(
          (state: CommonState, ids: ID[]) =>
            ids.reduce((acc, id) => {
              acc[id] = getEntryTimestamp(state, { kind: Kind.AGREEMENTS, id })
              return acc
            }, {} as { [id: number]: number | null }),
          ids
        )
        return selected
      },
      onBeforeAddToCache: function* (digitalContents: DigitalContentMetadata[]) {
        yield* addUsersFromDigitalContents(digitalContents)
        yield* put(
          digitalContentActions.setPermalinkStatus([
            {
              permalink,
              id: digitalContents[0].digital_content_id,
              status: Status.SUCCESS
            }
          ])
        )
        const checkedDigitalContents = yield* call(setDigitalContentsIsBlocked, digitalContents)
        return checkedDigitalContents.map(reformat)
      }
    }
  )
  const digital_content = digitalContents.entries[permalink]
  if (!digital_content || !digital_content.digital_content_id) return null
  const digitalContentId = digital_content.digital_content_id
  if (withStems) {
    yield* spawn(function* () {
      yield* call(fetchAndProcessStems, digitalContentId)
    })
  }

  if (withRemixes) {
    yield* spawn(function* () {
      yield* call(fetchAndProcessRemixes, digitalContentId)
    })
  }

  if (withRemixParents) {
    yield* spawn(function* () {
      yield* call(fetchAndProcessRemixParents, digitalContentId)
    })
  }
  return digital_content
}

/**
 * Retrieves digitalContents either from cache or from source.
 * Optionally:
 * - retrieves hiddenDigitalContents.
 * - includes stems of a parent digital_content.
 * - includes remixes of a parent digital_content.
 * - includes the remix parents of a digital_content.
 *
 * If retrieving unlisted digitalContents, request digitalContents as an array of `UnlistedDigitalContentRequests.`
 */
export function* retrieveDigitalContents({
  digitalContentIds,
  canBeUnlisted = false,
  withStems = false,
  withRemixes = false,
  withRemixParents = false
}: RetrieveDigitalContentsArgs) {
  const currentUserId: number | null = yield* select(getUserId)

  // In the case of unlisted digitalContents, digitalContentIds contains metadata used to fetch digitalContents
  const ids = canBeUnlisted
    ? (digitalContentIds as UnlistedDigitalContentRequest[]).map(({ id }) => id)
    : (digitalContentIds as ID[])

  if (canBeUnlisted && withStems) {
    yield* spawn(function* () {
      if (ids.length > 1) {
        console.warn('Stems endpoint only supports fetching single digitalContents')
        return
      }
      const digitalContentId = ids[0]
      if (!digitalContentId) return
      yield* call(fetchAndProcessStems, digitalContentId)
    })
  }

  if (withRemixes) {
    yield* spawn(function* () {
      if (ids.length > 1) {
        console.warn('Remixes endpoint only supports fetching single digitalContents')
        return
      }
      const digitalContentId = ids[0]
      if (!digitalContentId) return
      yield* call(fetchAndProcessRemixes, digitalContentId)
    })
  }

  if (withRemixParents) {
    yield* spawn(function* () {
      if (ids.length > 1) {
        console.warn(
          'Remix parents endpoint only supports fetching single digitalContents'
        )
        return
      }
      const digitalContentId = ids[0]
      if (!digitalContentId) return
      yield* call(fetchAndProcessRemixParents, digitalContentId)
    })
  }

  // @ts-ignore retrieve should be refactored to ts first
  const digitalContents: { entries: { [id: number]: DigitalContent } } = yield* call(retrieve, {
    ids,
    selectFromCache: function* (ids: ID[]) {
      return yield* select(getDigitalContentsSelector, { ids })
    },
    getEntriesTimestamp: function* (ids: ID[]) {
      const selected = yield* select(
        (state: CommonState, ids: ID[]) =>
          ids.reduce((acc, id) => {
            acc[id] = getEntryTimestamp(state, { kind: Kind.AGREEMENTS, id })
            return acc
          }, {} as { [id: number]: number | null }),
        ids
      )
      return selected
    },
    retrieveFromSource: function* (ids: ID[] | UnlistedDigitalContentRequest[]) {
      let fetched: UserDigitalContentMetadata | UserDigitalContentMetadata[] | null | undefined
      if (canBeUnlisted) {
        const ids = digitalContentIds as UnlistedDigitalContentRequest[]
        // TODO: remove the ColivingBackend
        // branches here when we support
        // bulk digital_content fetches in the API.
        if (ids.length > 1) {
          fetched = yield* call(
            ColivingBackend.getDigitalContentsIncludingUnlisted,
            digitalContentIds as UnlistedDigitalContentRequest[]
          )
        } else {
          fetched = yield* call([apiClient, 'getDigitalContent'], {
            id: ids[0].id,
            currentUserId,
            unlistedArgs: {
              urlTitle: ids[0].url_title,
              handle: ids[0].handle
            }
          })
        }
      } else {
        const ids = digitalContentIds as number[]
        if (ids.length > 1) {
          fetched = yield* call(ColivingBackend.getAllDigitalContents, {
            offset: 0,
            limit: ids.length,
            idsArray: ids as ID[]
          })
        } else {
          fetched = yield* call([apiClient, 'getDigitalContent'], {
            id: ids[0],
            currentUserId
          })
        }
      }
      return fetched
    },
    kind: Kind.AGREEMENTS,
    idField: 'digital_content_id',
    forceRetrieveFromSource: false,
    shouldSetLoading: true,
    deleteExistingEntry: false,
    onBeforeAddToCache: function* <T extends DigitalContentMetadata>(digitalContents: T[]) {
      yield* addUsersFromDigitalContents(digitalContents)
      const checkedDigitalContents = yield* call(setDigitalContentsIsBlocked, digitalContents)
      return checkedDigitalContents.map(reformat)
    }
  })

  return ids.map((id) => digitalContents.entries[id]).filter(Boolean)
}
