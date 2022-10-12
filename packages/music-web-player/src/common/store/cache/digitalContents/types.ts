import { Cache, DigitalContent } from '@coliving/common'

export interface DigitalContentsCacheState extends Cache<DigitalContent> {
  permalinks: { [permalink: string]: { id: number } }
}
