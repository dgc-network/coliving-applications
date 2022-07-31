import { Status, Cache, User } from '@coliving/common'

export interface UsersCacheState extends Cache<User> {
  handles: { [handle: string]: { id: number; status: Status } }
}
