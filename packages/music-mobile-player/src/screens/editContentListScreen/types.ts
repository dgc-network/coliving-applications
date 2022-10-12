import type { ID, Nullable } from '@coliving/common'
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
  digital_content_ids: {
    time: number
    digital_content: ID
  }[]
  removedAgreements: { agreementId: ID; timestamp: number }[]
}

export type UpdatedContentList = Omit<ContentListValues, 'cover_art'> & {
  updatedCoverArt?: Image
}
