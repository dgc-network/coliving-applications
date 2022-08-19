import {
  ID,
  Kind,
  Status,
  Agreement,
  AgreementMetadata,
  UserAgreementMetadata
} from '@coliving/common'
import { call, put, select, spawn } from 'typed-redux-saga/macro'

import { CommonState } from 'common/store'
import { getUserId } from 'common/store/account/selectors'
import { retrieve } from 'common/store/cache/sagas'
import { getEntryTimestamp } from 'common/store/cache/selectors'
import * as agreementActions from 'common/store/cache/agreements/actions'
import { getAgreements as getAgreementsSelector } from 'common/store/cache/agreements/selectors'
import ColivingBackend from 'services/ColivingBackend'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'

import { setAgreementsIsBlocked } from './blocklist'
import {
  fetchAndProcessRemixes,
  fetchAndProcessRemixParents
} from './fetchAndProcessRemixes'
import { fetchAndProcessStems } from './fetchAndProcessStems'
import { addUsersFromAgreements } from './helpers'
import { reformat } from './reformat'

type UnlistedAgreementRequest = { id: ID; url_title: string; handle: string }
type RetrieveAgreementsArgs = {
  agreementIds: ID[] | UnlistedAgreementRequest[]
  canBeUnlisted?: boolean
  withStems?: boolean
  withRemixes?: boolean
  withRemixParents?: boolean
  forceRetrieveFromSource?: boolean
}
type RetrieveAgreementByHandleAndSlugArgs = {
  handle: string
  slug: string
  withStems?: boolean
  withRemixes?: boolean
  withRemixParents?: boolean
}

export function* retrieveAgreementByHandleAndSlug({
  handle,
  slug,
  withStems,
  withRemixes,
  withRemixParents
}: RetrieveAgreementByHandleAndSlugArgs) {
  const permalink = `/${handle}/${slug}`
  const agreements: { entries: { [permalink: string]: Agreement } } = yield* call(
    // @ts-ignore retrieve should be refactored to ts first
    retrieve,
    {
      ids: [permalink],
      selectFromCache: function* (permalinks: string[]) {
        const agreement = yield* select(getAgreementsSelector, {
          permalinks
        })
        return agreement
      },
      retrieveFromSource: function* (permalinks: string[]) {
        const userId = yield* select(getUserId)
        const agreement = yield* call((args) => {
          const split = args[0].split('/')
          const handle = split[1]
          const slug = split.slice(2).join('')
          return apiClient.getAgreementByHandleAndSlug({
            handle,
            slug,
            currentUserId: userId
          })
        }, permalinks)
        return agreement
      },
      kind: Kind.AGREEMENTS,
      idField: 'agreement_id',
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
      onBeforeAddToCache: function* (agreements: AgreementMetadata[]) {
        yield* addUsersFromAgreements(agreements)
        yield* put(
          agreementActions.setPermalinkStatus([
            {
              permalink,
              id: agreements[0].agreement_id,
              status: Status.SUCCESS
            }
          ])
        )
        const checkedAgreements = yield* call(setAgreementsIsBlocked, agreements)
        return checkedAgreements.map(reformat)
      }
    }
  )
  const agreement = agreements.entries[permalink]
  if (!agreement || !agreement.agreement_id) return null
  const agreementId = agreement.agreement_id
  if (withStems) {
    yield* spawn(function* () {
      yield* call(fetchAndProcessStems, agreementId)
    })
  }

  if (withRemixes) {
    yield* spawn(function* () {
      yield* call(fetchAndProcessRemixes, agreementId)
    })
  }

  if (withRemixParents) {
    yield* spawn(function* () {
      yield* call(fetchAndProcessRemixParents, agreementId)
    })
  }
  return agreement
}

/**
 * Retrieves agreements either from cache or from source.
 * Optionally:
 * - retrieves hiddenAgreements.
 * - includes stems of a parent agreement.
 * - includes remixes of a parent agreement.
 * - includes the remix parents of a agreement.
 *
 * If retrieving unlisted agreements, request agreements as an array of `UnlistedAgreementRequests.`
 */
export function* retrieveAgreements({
  agreementIds,
  canBeUnlisted = false,
  withStems = false,
  withRemixes = false,
  withRemixParents = false
}: RetrieveAgreementsArgs) {
  const currentUserId: number | null = yield* select(getUserId)

  // In the case of unlisted agreements, agreementIds contains metadata used to fetch agreements
  const ids = canBeUnlisted
    ? (agreementIds as UnlistedAgreementRequest[]).map(({ id }) => id)
    : (agreementIds as ID[])

  if (canBeUnlisted && withStems) {
    yield* spawn(function* () {
      if (ids.length > 1) {
        console.warn('Stems endpoint only supports fetching single agreements')
        return
      }
      const agreementId = ids[0]
      if (!agreementId) return
      yield* call(fetchAndProcessStems, agreementId)
    })
  }

  if (withRemixes) {
    yield* spawn(function* () {
      if (ids.length > 1) {
        console.warn('Remixes endpoint only supports fetching single agreements')
        return
      }
      const agreementId = ids[0]
      if (!agreementId) return
      yield* call(fetchAndProcessRemixes, agreementId)
    })
  }

  if (withRemixParents) {
    yield* spawn(function* () {
      if (ids.length > 1) {
        console.warn(
          'Remix parents endpoint only supports fetching single agreements'
        )
        return
      }
      const agreementId = ids[0]
      if (!agreementId) return
      yield* call(fetchAndProcessRemixParents, agreementId)
    })
  }

  // @ts-ignore retrieve should be refactored to ts first
  const agreements: { entries: { [id: number]: Agreement } } = yield* call(retrieve, {
    ids,
    selectFromCache: function* (ids: ID[]) {
      return yield* select(getAgreementsSelector, { ids })
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
    retrieveFromSource: function* (ids: ID[] | UnlistedAgreementRequest[]) {
      let fetched: UserAgreementMetadata | UserAgreementMetadata[] | null | undefined
      if (canBeUnlisted) {
        const ids = agreementIds as UnlistedAgreementRequest[]
        // TODO: remove the ColivingBackend
        // branches here when we support
        // bulk agreement fetches in the API.
        if (ids.length > 1) {
          fetched = yield* call(
            ColivingBackend.getAgreementsIncludingUnlisted,
            agreementIds as UnlistedAgreementRequest[]
          )
        } else {
          fetched = yield* call([apiClient, 'getAgreement'], {
            id: ids[0].id,
            currentUserId,
            unlistedArgs: {
              urlTitle: ids[0].url_title,
              handle: ids[0].handle
            }
          })
        }
      } else {
        const ids = agreementIds as number[]
        if (ids.length > 1) {
          fetched = yield* call(ColivingBackend.getAllAgreements, {
            offset: 0,
            limit: ids.length,
            idsArray: ids as ID[]
          })
        } else {
          fetched = yield* call([apiClient, 'getAgreement'], {
            id: ids[0],
            currentUserId
          })
        }
      }
      return fetched
    },
    kind: Kind.AGREEMENTS,
    idField: 'agreement_id',
    forceRetrieveFromSource: false,
    shouldSetLoading: true,
    deleteExistingEntry: false,
    onBeforeAddToCache: function* <T extends AgreementMetadata>(agreements: T[]) {
      yield* addUsersFromAgreements(agreements)
      const checkedAgreements = yield* call(setAgreementsIsBlocked, agreements)
      return checkedAgreements.map(reformat)
    }
  })

  return ids.map((id) => agreements.entries[id]).filter(Boolean)
}
