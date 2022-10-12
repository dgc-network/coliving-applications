import type { makeGetTableMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import type { SetOptional } from 'type-fest'

export type DigitalContentMetadata = SetOptional<
  ReturnType<ReturnType<typeof makeGetTableMetadatas>>['entries'][0],
  'uid' | 'kind' | 'id' | 'followeeReposts'
>

export type DigitalContentsMetadata = DigitalContentMetadata[]
