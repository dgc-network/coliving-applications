import { ID, StemCategory, StemUpload, Agreement, StemAgreement } from '@coliving/common'

export const updateAndFlattenStems = (
  stems: StemUpload[][],
  parentAgreementIds: ID[]
) => {
  return stems.flatMap((stemList, i) => {
    const parentAgreementId = parentAgreementIds[i]

    return stemList.map((stem) => {
      const metadata = createStemMetadata({
        parentAgreementId,
        agreement: stem.metadata,
        stemCategory: stem.category
      })
      return {
        metadata,
        agreement: {
          ...stem,
          metadata
        }
      }
    })
  })
}

export const createStemMetadata = ({
  parentAgreementId,
  agreement,
  stemCategory
}: {
  parentAgreementId: ID
  agreement: Agreement
  stemCategory: StemCategory
}): StemAgreement => {
  return {
    ...agreement,
    download: {
      cid: null,
      is_downloadable: true,
      // IMPORTANT: Stems never require a follow to download in their metadata
      // but should determine their downloadability based on the parent agreement's
      // requirements.
      requires_follow: false
    },
    stem_of: {
      parent_agreement_id: parentAgreementId,
      category: stemCategory
    }
  }
}
