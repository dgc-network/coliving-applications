import { ID, LineupState } from '@coliving/common'
import { Moment } from 'moment'

export default interface HistoryPageState {
  tracks: LineupState<{ id: ID; dateListened: Moment }>
}
