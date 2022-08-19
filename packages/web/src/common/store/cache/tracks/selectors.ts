import { Kind, ID, UID, Status, Agreement } from '@coliving/common'

import { CommonState } from 'common/store'
import { getEntry, getAllEntries } from 'common/store/cache/selectors'

export const getAgreement = (
  state: CommonState,
  props: { id?: ID | null; uid?: UID | null; permalink?: string | null }
) => {
  if (
    props.permalink &&
    state.agreements.permalinks[props.permalink.toLowerCase()]
  ) {
    props.id = state.agreements.permalinks[props.permalink.toLowerCase()].id
  }
  return getEntry(state, {
    ...props,
    kind: Kind.AGREEMENTS
  })
}

export const getStatus = (state: CommonState, props: { id?: ID | null }) =>
  (props.id && state.agreements.statuses[props.id]) || null

export const getAgreements = (
  state: CommonState,
  props: {
    ids?: ID[] | null
    uids?: UID[] | null
    permalinks?: string[] | null
  }
) => {
  if (props && props.ids) {
    const agreements: { [id: number]: Agreement } = {}
    props.ids.forEach((id) => {
      const agreement = getAgreement(state, { id })
      if (agreement) {
        agreements[id] = agreement
      }
    })
    return agreements
  } else if (props && props.uids) {
    const agreements: { [id: number]: Agreement } = {}
    props.uids.forEach((uid) => {
      const agreement = getAgreement(state, { uid })
      if (agreement) {
        agreements[agreement.agreement_id] = agreement
      }
    })
    return agreements
  } else if (props && props.permalinks) {
    const agreements: { [permalink: string]: Agreement } = {}
    props.permalinks.forEach((permalink) => {
      const agreement = getAgreement(state, { permalink })
      if (agreement) agreements[permalink] = agreement
    })
    return agreements
  }
  return getAllEntries(state, { kind: Kind.AGREEMENTS })
}

// TODO:
export const getAgreementsByUid = (state: CommonState) => {
  return Object.keys(state.agreements.uids).reduce((entries, uid) => {
    entries[uid] = getAgreement(state, { uid })
    return entries
  }, {} as { [uid: string]: Agreement | null })
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
