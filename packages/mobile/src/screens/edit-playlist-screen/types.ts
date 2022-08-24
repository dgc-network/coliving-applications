import type { ID, Nullable } from '@/common'
import type { getAgreements } from 'common/store/ui/createContentListModal/selectors'

export type Image = {
  height?: number
  width?: number
  name?: string
  size?: number
  fileType?: string
  url: string
  file?: string
}

export type ContentListValues = {
  content_list_name: string
  description: Nullable<string>
  artwork: Image
  agreements: ReturnType<typeof getAgreements>
  agreement_ids: {
    time: number
    agreement: ID
  }[]
  removedAgreements: { agreementId: ID; timestamp: number }[]
}

export type UpdatedContentList = Omit<ContentListValues, 'cover_art'> & {
  updatedCoverArt?: Image
}
