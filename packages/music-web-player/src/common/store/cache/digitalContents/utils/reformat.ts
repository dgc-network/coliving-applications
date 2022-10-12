import { CoverArtSizes, DigitalContent, DigitalContentMetadata } from '@coliving/common'
import { omit } from 'lodash'

import ColivingBackend from 'services/colivingBackend'

/**
 * Adds _cover_art_sizes to a digital_content object if it does not have one set
 */
const addDigitalContentImages = <T extends DigitalContentMetadata>(
  digital_content: T
): T & { duration: number; _cover_art_sizes: CoverArtSizes } => {
  return ColivingBackend.getDigitalContentImages(digital_content)
}

/**
 * Potentially add
 * @param digital_content
 */
const setIsCoSigned = <T extends DigitalContentMetadata>(digital_content: T) => {
  const { remix_of } = digital_content

  const remixOfDigitalContent = remix_of?.digitalContents?.[0]

  const isCoSigned =
    remixOfDigitalContent &&
    (remixOfDigitalContent.has_remix_author_saved ||
      remixOfDigitalContent.has_remix_author_reposted)

  if (isCoSigned) {
    return {
      ...digital_content,
      _co_sign: remix_of!.digitalContents[0]
    }
  }
  return digital_content
}

/**
 * When a digital_content is not unlisted, even if field visibility is set
 * we should coerce the digital_content into a state where socials are visible.
 * @param digital_content
 * @returns digital_content with repaired field visibility
 */
const setFieldVisibility = <T extends DigitalContentMetadata>(digital_content: T) => {
  const { is_unlisted } = digital_content
  if (!is_unlisted) {
    // Public digital_content
    return {
      ...digital_content,
      field_visibility: {
        ...digital_content.field_visibility,
        genre: true,
        mood: true,
        tags: true,
        share: true,
        play_count: true
      }
    }
  }
  return digital_content
}

/**
 * NOTE: This is a temporary fix for a backend bug: The field followee_saves is not defined.
 * This is a stopgap to prevent the client from erroring and should be removed after fixed.
 * The current erroneous disprov endpoint is `/feed/reposts/<userid>`
 * @param digital_content
 */
const setDefaultFolloweeSaves = <T extends DigitalContentMetadata>(digital_content: T) => {
  return {
    ...digital_content,
    followee_saves: digital_content?.followee_saves ?? []
  }
}

/**
 * Reformats a digital_content to be used internally within the client
 * This method should *always* be called before a digital_content is cached.
 */
export const reformat = <T extends DigitalContentMetadata>(digital_content: T): DigitalContent => {
  const t = digital_content
  const withoutUser = omit(t, 'user')
  const withImages = addDigitalContentImages(withoutUser)
  const withCosign = setIsCoSigned(withImages)
  const withFieldVisibility = setFieldVisibility(withCosign)

  const withDefaultSaves = setDefaultFolloweeSaves(withFieldVisibility)
  return withDefaultSaves
}
