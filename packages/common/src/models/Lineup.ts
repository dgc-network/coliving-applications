import { ID, UID } from 'models/identifiers'
import { Kind } from 'models/kind'
import { Status } from 'models/status'
import { Nullable } from 'utils/typeUtils'

export type Lineup<T, ExtraProps = {}> = {
  entries: T[]
  order: {
    [uid: string]: number
  }
  total: number
  deleted: number
  nullCount: number
  status: Status
  hasMore: boolean
  inView: boolean
  prefix: string
  page: number
  isMetadataLoading: boolean
} & ExtraProps

export type LineupStateDigitalContent<T> = { uid: UID; kind: Kind; id: ID } & T

export type Order = Record<UID, number>

// Add possibility of attaching extra metadata to entries with type `T`
// e.g. DateAdded
export type LineupState<T> = {
  entries: Array<LineupStateDigitalContent<T>>
  order: Order
  total: number
  deleted: number
  nullCount: number
  status: Status
  hasMore: boolean
  inView: boolean
  prefix: string
  page: number
  isMetadataLoading: boolean
  dedupe?: boolean
  containsDeleted: boolean
  maxEntries: Nullable<number>
  entryIds?: Nullable<Set<UID>>
}
