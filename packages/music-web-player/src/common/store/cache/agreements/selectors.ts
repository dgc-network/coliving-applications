import { Kind, ID, UID, Status, DigitalContent } from '@coliving/common'

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
    const agreements: { [id: number]: DigitalContent } = {}
    props.ids.forEach((id) => {
      const digital_content = getAgreement(state, { id })
      if (digital_content) {
        agreements[id] = digital_content
      }
    })
    return agreements
  } else if (props && props.uids) {
    const agreements: { [id: number]: DigitalContent } = {}
    props.uids.forEach((uid) => {
      const digital_content = getAgreement(state, { uid })
      if (digital_content) {
        agreements[digital_content.digital_content_id] = digital_content
      }
    })
    return agreements
  } else if (props && props.permalinks) {
    const agreements: { [permalink: string]: DigitalContent } = {}
    props.permalinks.forEach((permalink) => {
      const digital_content = getAgreement(state, { permalink })
      if (digital_content) agreements[permalink] = digital_content
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
  }, {} as { [uid: string]: DigitalContent | null })
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
