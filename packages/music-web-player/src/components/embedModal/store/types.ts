import { ID, PlayableType } from '@coliving/common'

export type EmbedModalState = {
  isOpen: boolean
  id: ID | null
  kind: PlayableType | null
}
