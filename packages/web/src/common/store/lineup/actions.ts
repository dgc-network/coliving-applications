import { ID, UID, AgreementMetadata } from '@coliving/common'

export const FETCH_LINEUP_METADATAS = 'FETCH_LINEUP_METADATAS'
export const FETCH_LINEUP_METADATAS_REQUESTED =
  'FETCH_LINEUP_METADATAS_REQUESTED'
export const FETCH_LINEUP_METADATAS_SUCCEEDED =
  'FETCH_LINEUP_METADATAS_SUCCEEDED'
export const FETCH_LINEUP_METADATAS_FAILED = 'FETCH_LINEUP_METADATAS_FAILED'

export const FETCH_AGREEMENTS_METADATAS = 'FETCH_AGREEMENTS_METADATAS'
export const FETCH_AGREEMENTS_METADATAS_REQUESTED =
  'FETCH_AGREEMENTS_METADATAS_REQUESTED'
export const FETCH_AGREEMENTS_METADATAS_SUCCEEDED =
  'FETCH_AGREEMENTS_METADATAS_SUCCEEDED'
export const FETCH_AGREEMENTS_METADATAS_FAILED = 'FETCH_AGREEMENTS_METADATAS_FAILED'

export const FETCH_AGREEMENT_LIVE = 'FETCH_AGREEMENT_LIVE'
export const FETCH_AGREEMENT_LIVE_REQUESTED = 'FETCH_AGREEMENT_LIVE_REQUESTED'
export const FETCH_AGREEMENT_LIVE_SUCCEEDED = 'FETCH_AGREEMENT_LIVE_SUCCEEDED'
export const UPDATE_LINEUP_ORDER = 'UPDATE_LINEUP_ORDER'

export const PLAY = 'PLAY'
export const PAUSE = 'PAUSE'

export const RESET = 'RESET'
export const RESET_SUCCEEDED = 'RESET_SUCCEEDED'

export const SET_IN_VIEW = 'SET_IN_VIEW'
export const REFRESH_IN_VIEW = 'REFRESH_IN_VIEW'

export const UPDATE_AGREEMENT_METADATA = 'UPDATE_AGREEMENT_METADATA'
export const REMOVE = 'REMOVE'
export const ADD = 'ADD'
export const SET_LOADING = 'SET_LOADING'

export const SET_PAGE = 'SET_PAGE'

export const addPrefix = (prefix: string, actionType: string) => {
  return `${prefix}_${actionType}`
}

export const stripPrefix = (prefix: string, actionType: string) => {
  return actionType.replace(`${prefix}_`, '')
}

/**
 * A generic class of common Lineup actions for fetching, loading and
 * simple playback.
 * @example
 *  // playlist.js
 *  // Creates lineup actions for a playlist, e.g.
 *  // PLAYLIST_FETCH_AGREEMENTS_METADATAS.
 *  class PlaylistActions extends LineupActions {
 *    constructor () {
 *      super("PLAYLIST")
 *    }
 *  }
 *  export const playlistActions = new PlaylistActions()
 */
export class LineupActions {
  prefix: string
  removeDeleted: boolean

  constructor(prefix: string, removeDeleted = false) {
    this.prefix = prefix
    this.removeDeleted = removeDeleted
  }

  getPrefix() {
    return this.prefix
  }

  /**
   * Fetches entity metadatas for the lineup.
   * Side-effect: Fetches relevant creators and caches loaded agreements.
   * @param {number} [offset] the offset into the "get agreements" query
   * @param {number} [limit] the limit for the "get agreements" query
   * @param {boolean} [overwrite] a boolean indicating whether to overwrite cached entries the fetch may be refetching
   * @param {*} [payload] keyword args payload to send to the "get agreements" query
   */
  fetchLineupMetadatas(
    offset = 0,
    limit = 10,
    overwrite = false,
    payload?: unknown
  ) {
    return {
      type: addPrefix(this.prefix, FETCH_LINEUP_METADATAS),
      offset,
      limit,
      overwrite,
      payload
    }
  }

  fetchLineupMetadatasRequested(
    offset = 0,
    limit = 10,
    overwrite = false,
    payload: unknown
  ) {
    return {
      type: addPrefix(this.prefix, FETCH_LINEUP_METADATAS_REQUESTED),
      offset,
      limit,
      overwrite,
      payload
    }
  }

  fetchLineupMetadatasSucceeded(
    entries: unknown,
    offset: number,
    limit: number,
    deleted: boolean,
    nullCount: boolean
  ) {
    return {
      type: addPrefix(this.prefix, FETCH_LINEUP_METADATAS_SUCCEEDED),
      entries,
      offset,
      limit,
      deleted,
      nullCount
    }
  }

  fetchLineupMetadatasFailed() {
    return {
      type: addPrefix(this.prefix, FETCH_LINEUP_METADATAS_FAILED)
    }
  }

  fetchAgreementAudio(agreementMetadata: AgreementMetadata) {
    return {
      type: addPrefix(this.prefix, FETCH_AGREEMENT_LIVE),
      agreementMetadata
    }
  }

  fetchAgreementAudioRequested(index: number, agreementId: ID) {
    return {
      type: addPrefix(this.prefix, FETCH_AGREEMENT_LIVE_REQUESTED),
      index,
      agreementId
    }
  }

  fetchAgreementAudioSucceeded(index: number, agreementId: ID) {
    return {
      type: addPrefix(this.prefix, FETCH_AGREEMENT_LIVE_SUCCEEDED),
      index,
      agreementId
    }
  }

  play(uid?: UID) {
    return {
      type: addPrefix(this.prefix, PLAY),
      uid
    }
  }

  pause() {
    return {
      type: addPrefix(this.prefix, PAUSE)
    }
  }

  updateAgreementMetadata(agreementId: ID, metadata: AgreementMetadata) {
    return {
      type: addPrefix(this.prefix, UPDATE_AGREEMENT_METADATA),
      agreementId,
      metadata
    }
  }

  updateLineupOrder(orderedIds: UID[]) {
    return {
      type: addPrefix(this.prefix, UPDATE_LINEUP_ORDER),
      orderedIds
    }
  }

  // Side-effect: Unsubscribes this lineup from cache entries it is subscribed to.
  reset(source?: string) {
    return {
      type: addPrefix(this.prefix, RESET),
      source
    }
  }

  resetSucceeded() {
    return {
      type: addPrefix(this.prefix, RESET_SUCCEEDED)
    }
  }

  add(entry: unknown, id: ID) {
    return {
      type: addPrefix(this.prefix, ADD),
      entry,
      id
    }
  }

  remove(kind: string, uid: UID) {
    return {
      type: addPrefix(this.prefix, REMOVE),
      kind,
      uid
    }
  }

  setInView(inView: boolean) {
    return {
      type: addPrefix(this.prefix, SET_IN_VIEW),
      inView
    }
  }

  // If limit is not provided, we use whatever is in the state
  refreshInView(overwrite = false, payload?: unknown, limit = null) {
    return {
      type: addPrefix(this.prefix, REFRESH_IN_VIEW),
      overwrite,
      payload,
      limit
    }
  }

  setLoading() {
    return {
      type: addPrefix(this.prefix, SET_LOADING)
    }
  }

  setPage = (page: number) => {
    return {
      type: addPrefix(this.prefix, SET_PAGE),
      page
    }
  }
}
