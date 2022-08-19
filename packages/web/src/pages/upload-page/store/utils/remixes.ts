import { ID } from '@coliving/common'

export const createRemixOfMetadata = ({
  parentAgreementId
}: {
  parentAgreementId: ID
}) => {
  return {
    agreements: [
      {
        parent_agreement_id: parentAgreementId
      }
    ]
  }
}
