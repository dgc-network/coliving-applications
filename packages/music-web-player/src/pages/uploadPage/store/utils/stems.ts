import { ID, StemCategory, StemUpload, DigitalContent, StemDigitalContent } from '@coliving/common'

export const updateAndFlattenStems = (
  stems: StemUpload[][],
  parentDigitalContentIds: ID[]
) => {
  return stems.flatMap((stemList, i) => {
    const parentDigitalContentId = parentDigitalContentIds[i]

    return stemList.map((stem) => {
      const metadata = createStemMetadata({
        parentDigitalContentId,
        digital_content: stem.metadata,
        stemCategory: stem.category
      })
      return {
        metadata,
        digital_content: {
          ...stem,
          metadata
        }
      }
    })
  })
}

export const createStemMetadata = ({
  parentDigitalContentId,
  digital_content,
  stemCategory
}: {
  parentDigitalContentId: ID
  digital_content: DigitalContent
  stemCategory: StemCategory
}): StemDigitalContent => {
  return {
    ...digital_content,
    download: {
      cid: null,
      is_downloadable: true,
      // IMPORTANT: Stems never require a follow to download in their metadata
      // but should determine their downloadability based on the parent digital_content's
      // requirements.
      requires_follow: false
    },
    stem_of: {
      parent_digital_content_id: parentDigitalContentId,
      category: stemCategory
    }
  }
}
