import { CoverArtSizes, Agreement, AgreementMetadata } from '@coliving/common'
import { omit } from 'lodash'

import ColivingBackend from 'services/colivingBackend'

/**
 * Adds _cover_art_sizes to a agreement object if it does not have one set
 */
const addAgreementImages = <T extends AgreementMetadata>(
  agreement: T
): T & { duration: number; _cover_art_sizes: CoverArtSizes } => {
  return ColivingBackend.getAgreementImages(agreement)
}

/**
 * Potentially add
 * @param agreement
 */
const setIsCoSigned = <T extends AgreementMetadata>(agreement: T) => {
  const { remix_of } = agreement

  const remixOfAgreement = remix_of?.agreements?.[0]

  const isCoSigned =
    remixOfAgreement &&
    (remixOfAgreement.has_remix_author_saved ||
      remixOfAgreement.has_remix_author_reposted)

  if (isCoSigned) {
    return {
      ...agreement,
      _co_sign: remix_of!.agreements[0]
    }
  }
  return agreement
}

/**
 * When a agreement is not unlisted, even if field visibility is set
 * we should coerce the agreement into a state where socials are visible.
 * @param agreement
 * @returns agreement with repaired field visibility
 */
const setFieldVisibility = <T extends AgreementMetadata>(agreement: T) => {
  const { is_unlisted } = agreement
  if (!is_unlisted) {
    // Public agreement
    return {
      ...agreement,
      field_visibility: {
        ...agreement.field_visibility,
        genre: true,
        mood: true,
        tags: true,
        share: true,
        play_count: true
      }
    }
  }
  return agreement
}

/**
 * NOTE: This is a temporary fix for a backend bug: The field followee_saves is not defined.
 * This is a stopgap to prevent the client from erroring and should be removed after fixed.
 * The current erroneous disprov endpoint is `/feed/reposts/<userid>`
 * @param agreement
 */
const setDefaultFolloweeSaves = <T extends AgreementMetadata>(agreement: T) => {
  return {
    ...agreement,
    followee_saves: agreement?.followee_saves ?? []
  }
}

/**
 * Reformats a agreement to be used internally within the client
 * This method should *always* be called before a agreement is cached.
 */
export const reformat = <T extends AgreementMetadata>(agreement: T): Agreement => {
  const t = agreement
  const withoutUser = omit(t, 'user')
  const withImages = addAgreementImages(withoutUser)
  const withCosign = setIsCoSigned(withImages)
  const withFieldVisibility = setFieldVisibility(withCosign)

  const withDefaultSaves = setDefaultFolloweeSaves(withFieldVisibility)
  return withDefaultSaves
}
