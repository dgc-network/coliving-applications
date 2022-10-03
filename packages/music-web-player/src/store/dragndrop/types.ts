import { Kind, ID } from '@coliving/common'

export interface DragNDropState {
  dragging: boolean
  kind: Kind
  id: ID
}
