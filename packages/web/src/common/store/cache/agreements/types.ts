import { Cache, Agreement } from '@coliving/common'

export interface AgreementsCacheState extends Cache<Agreement> {
  permalinks: { [permalink: string]: { id: number } }
}
