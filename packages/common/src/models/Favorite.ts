import { ID } from 'models/Identifiers'

export enum FavoriteType {
  AGREEMENT = 'agreement',
  CONTENT_LIST = 'content_list'
}

export type Favorite = {
  save_item_id: ID
  save_type: FavoriteType
  user_id: number
}
