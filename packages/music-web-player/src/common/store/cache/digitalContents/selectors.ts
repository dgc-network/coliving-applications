import { Kind, ID, UID, Status, DigitalContent } from '@coliving/common'

import { CommonState } from 'common/store'
import { getEntry, getAllEntries } from 'common/store/cache/selectors'

export const getDigitalContent = (
  state: CommonState,
  props: { id?: ID | null; uid?: UID | null; permalink?: string | null }
) => {
  if (
    props.permalink &&
    state.digitalContents.permalinks[props.permalink.toLowerCase()]
  ) {
    props.id = state.digitalContents.permalinks[props.permalink.toLowerCase()].id
  }
  return getEntry(state, {
    ...props,
    kind: Kind.DIGITAL_CONTENTS
  })
}

export const getStatus = (state: CommonState, props: { id?: ID | null }) =>
  (props.id && state.digitalContents.statuses[props.id]) || null

export const getDigitalContents = (
  state: CommonState,
  props: {
    ids?: ID[] | null
    uids?: UID[] | null
    permalinks?: string[] | null
  }
) => {
  if (props && props.ids) {
    const digitalContents: { [id: number]: DigitalContent } = {}
    props.ids.forEach((id) => {
      const digital_content = getDigitalContent(state, { id })
      if (digital_content) {
        digitalContents[id] = digital_content
      }
    })
    return digitalContents
  } else if (props && props.uids) {
    const digitalContents: { [id: number]: DigitalContent } = {}
    props.uids.forEach((uid) => {
      const digital_content = getDigitalContent(state, { uid })
      if (digital_content) {
        digitalContents[digital_content.digital_content_id] = digital_content
      }
    })
    return digitalContents
  } else if (props && props.permalinks) {
    const digitalContents: { [permalink: string]: DigitalContent } = {}
    props.permalinks.forEach((permalink) => {
      const digital_content = getDigitalContent(state, { permalink })
      if (digital_content) digitalContents[permalink] = digital_content
    })
    return digitalContents
  }
  return getAllEntries(state, { kind: Kind.DIGITAL_CONTENTS })
}

// TODO:
export const getDigitalContentsByUid = (state: CommonState) => {
  return Object.keys(state.digitalContents.uids).reduce((entries, uid) => {
    entries[uid] = getDigitalContent(state, { uid })
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
