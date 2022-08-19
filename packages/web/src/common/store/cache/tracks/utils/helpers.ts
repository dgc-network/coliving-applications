import { Kind, AgreementMetadata, User, makeUid } from '@coliving/common'
import { uniqBy } from 'lodash'
import { put, select } from 'redux-saga/effects'

import { getAccountUser } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { reformat as reformatUser } from 'common/store/cache/users/utils'

/**
 * Adds users from agreement metadata to cache.
 * Dedupes and removes self.
 * @param metadataArray
 */
export function* addUsersFromAgreements<T extends AgreementMetadata & { user?: User }>(
  metadataArray: T[]
) {
  const accountUser: ReturnType<typeof getAccountUser> = yield select(
    getAccountUser
  )
  const currentUserId = accountUser?.user_id
  let users = metadataArray
    .filter((m) => m.user)
    .map((m) => {
      const agreement = m as AgreementMetadata & { user: User }
      return {
        id: agreement.user.user_id,
        uid: makeUid(Kind.USERS, agreement.user.user_id),
        metadata: reformatUser(agreement.user)
      }
    })

  if (!users.length) return

  // Don't add duplicate users or self
  users = uniqBy(users, 'id')
  users = users.filter((user) => !(currentUserId && user.id === currentUserId))

  yield put(
    cacheActions.add(Kind.USERS, users, /* replace */ false, /* persist */ true)
  )
}
