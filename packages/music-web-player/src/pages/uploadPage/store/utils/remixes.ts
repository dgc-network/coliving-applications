import { ID } from '@coliving/common'

export const createRemixOfMetadata = ({
  parentDigitalContentId
}: {
  parentDigitalContentId: ID
}) => {
  return {
    digitalContents: [
      {
        parent_digital_content_id: parentDigitalContentId
      }
    ]
  }
}
