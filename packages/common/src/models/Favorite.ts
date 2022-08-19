import { ID } from 'models/Identifiers'

export enum FavoriteType {
  AGREEMENT = 'agreement',
  PLAYLIST = 'playlist'
}

export type Favorite = {
  save_item_id: ID
  save_type: FavoriteType
  user_id: number
}
