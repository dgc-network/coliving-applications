import { ID, UID } from 'models/identifiers'
import { Kind } from 'models/kind'
import { Status } from 'models/status'

export type Cacheable<T> = {
  metadata: T
  _timestamp: number
}

export type Cache<T> = {
  entries: { [id: number]: Cacheable<T> }
  statuses: { [id: number]: Status }
  uids: { [uid: string]: ID }
  subscribers: { [id: number]: Set<UID> }
  subscriptions: { [id: number]: Set<{ uid: UID; kind: Kind }> }
  idsToPrune: Set<ID>
}
