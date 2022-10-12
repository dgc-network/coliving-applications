import { Cache, DigitalContent } from '@coliving/common'

export interface AgreementsCacheState extends Cache<DigitalContent> {
  permalinks: { [permalink: string]: { id: number } }
}
