import { Collectible } from '@coliving/common'

export type CollectibleState = {
  [wallet: string]: Collectible[]
}
