import { ID, StemCategory, StemUpload, DigitalContent, StemAgreement } from '@coliving/common'

export const updateAndFlattenStems = (
  stems: StemUpload[][],
  parentAgreementIds: ID[]
) => {
  return stems.flatMap((stemList, i) => {
    const parentAgreementId = parentAgreementIds[i]

    return stemList.map((stem) => {
      const metadata = createStemMetadata({
        parentAgreementId,
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
  parentAgreementId,
  digital_content,
  stemCategory
}: {
  parentAgreementId: ID
  digital_content: DigitalContent
  stemCategory: StemCategory
}): StemAgreement => {
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
      parent_digital_content_id: parentAgreementId,
      category: stemCategory
    }
  }
}
