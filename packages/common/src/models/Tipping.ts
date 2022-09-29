import { ID } from 'models/identifiers'
import { Nullable } from 'utils/typeUtils'

import { StringWei } from './wallet'

export type Supporter = {
  sender_id: ID
  amount: StringWei
  rank: number
}

export type Supporting = {
  receiver_id: ID
  amount: StringWei
  rank: number
}

export type UserTip = {
  amount: StringWei
  sender_id: ID
  receiver_id: ID
  followee_supporter_ids: ID[]
  slot: number
  created_at: string
  tx_signature: string
}

export type RecentTipsStorage = {
  dismissed: boolean
  minSlot: number
  lastDismissalTimestamp: Nullable<number>
}
