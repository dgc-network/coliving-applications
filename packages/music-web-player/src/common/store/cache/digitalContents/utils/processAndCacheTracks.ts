import { Kind, DigitalContent, DigitalContentMetadata, makeUid } from '@coliving/common'
import { put, call } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'

import { setDigitalContentsIsBlocked } from './blocklist'
import { addUsersFromDigitalContents } from './helpers'
import { reformat } from './reformat'

/**
 * Processes digitalContents, adding users and calling `reformat`, before
 * caching the digitalContents.
 * @param digitalContents
 */
export function* processAndCacheDigitalContents<T extends DigitalContentMetadata>(
  digitalContents: T[]
): Generator<any, DigitalContent[], any> {
  // Add users
  yield addUsersFromDigitalContents(digitalContents)

  const checkedDigitalContents: T[] = yield call(setDigitalContentsIsBlocked, digitalContents)

  // Remove users, add images
  const reformattedDigitalContents = checkedDigitalContents.map(reformat)

  // insert digitalContents into cache
  yield put(
    cacheActions.add(
      Kind.AGREEMENTS,
      reformattedDigitalContents.map((t) => ({
        id: t.digital_content_id,
        uid: makeUid(Kind.AGREEMENTS, t.digital_content_id),
        metadata: t
      })),
      false,
      true
    )
  )

  return reformattedDigitalContents
}
