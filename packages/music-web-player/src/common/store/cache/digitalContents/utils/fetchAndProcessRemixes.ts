import { ID, Kind, UserDigitalContentMetadata, removeNullable } from '@coliving/common'
import { select, call, put } from 'typed-redux-saga/macro'

import { getUserId } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { waitForValue } from 'utils/sagaHelpers'

import { getDigitalContent } from '../selectors'

import { processAndCacheDigitalContents } from './processAndCacheDigitalContents'

const INITIAL_FETCH_LIMIT = 6

/**
 * Fetches remixes for a parent digital_content.
 * Caches the remixes as digitalContents, and updates the parent
 * digital_content with a reference to the remixes.
 *
 * @param digitalContentId the parent digital_content for which to fetch remixes
 */
export function* fetchAndProcessRemixes(digitalContentId: ID) {
  const currentUserId = yield* select(getUserId)
  const {
    digitalContents: remixes,
    count
  }: { digitalContents: UserDigitalContentMetadata[]; count: number } = yield* call(
    [apiClient, 'getRemixes'],
    {
      digitalContentId,
      offset: 0,
      limit: INITIAL_FETCH_LIMIT,
      currentUserId
    }
  )

  if (!remixes) return

  if (remixes.length) {
    yield* call(processAndCacheDigitalContents, remixes)
  }

  // Create the update
  // Note: This update is made eagerly (potentially before the parent digital_content is cached).
  // This is OK because the cache action will not overwrite this data, and it's important
  // that we can recognize ASAP that the digital_content has remixes.
  // The digital_content will still go through it's normal lifecycle of status (loading => success/error)
  // and the availability of these fields give a hint to the skeleton layout.
  const remixesUpdate = remixes.map((r) => ({
    digital_content_id: r.digital_content_id
  }))

  yield* put(
    cacheActions.update(Kind.AGREEMENTS, [
      {
        id: digitalContentId,
        metadata: {
          _remixes: remixesUpdate,
          _remixes_count: count
        }
      }
    ])
  )
}

/**
 * Fetches parents for a remixed digital_content.
 * Caches the parents as digitalContents, and updates the remixed digital_content
 * with a reference to the parent.
 *
 * @param digitalContentId the digital_content for which to fetch remix parents
 */
export function* fetchAndProcessRemixParents(digitalContentId: ID) {
  const currentUserId = yield* select(getUserId)
  const remixParents = (yield* call([apiClient, 'getRemixing'], {
    digitalContentId,
    limit: 1,
    offset: 0,
    currentUserId
  })).filter(removeNullable)

  if (!remixParents) return

  if (remixParents.length) {
    yield* call(processAndCacheDigitalContents, remixParents)
  }

  // Don't update the original digital_content with parents until it's in the cache
  yield* call(waitForValue, getDigitalContent, { id: digitalContentId })

  // Create the update
  const remixParentsUpdate = remixParents.map((s) => ({
    digital_content_id: s.digital_content_id
  }))

  yield* put(
    cacheActions.update(Kind.AGREEMENTS, [
      {
        id: digitalContentId,
        metadata: {
          _remix_parents: remixParentsUpdate
        }
      }
    ])
  )
}
