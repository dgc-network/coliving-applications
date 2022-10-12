import { pick } from 'lodash'

import { createRemixOfMetadata } from 'pages/uploadPage/store/utils/remixes'

const agreementMetadataSchema = {
  owner_id: null,
  title: null,
  length: null,
  cover_art: null,
  cover_art_sizes: null,
  tags: null,
  genre: null,
  mood: null,
  credits_splits: null,
  created_at: null,
  // TODO: CREATE DATE IS REQUIRED, BUT THIS FIELD IS NEVER USED.
  create_date: null,
  updated_at: null,
  release_date: null,
  file_type: null,
  digital_content_segments: [],
  has_current_user_reposted: false,
  followee_reposts: null,
  followee_saves: null,
  is_current: true,
  is_unlisted: false,
  field_visibility: {
    genre: true,
    mood: true,
    tags: true,
    share: false,
    play_count: false,
    remixes: true
  },
  remix_of: null,
  repost_count: 0,
  save_count: 0,
  description: null,
  license: null,
  isrc: null,
  iswc: null,
  download: null
}

export const newAgreementMetadata = (fields, validate = false) => {
  const validFields = validate
    ? pick(fields, Object.keys(agreementMetadataSchema).concat(['digital_content_id']))
    : fields
  const remixParentAgreementId = fields?.remix_of?.agreements?.[0]?.parent_digital_content_id
  return {
    ...agreementMetadataSchema,
    digital_content_segments: [...agreementMetadataSchema.digital_content_segments],
    followee_reposts: [...(agreementMetadataSchema.followee_reposts || [])],
    followee_saves: [...(agreementMetadataSchema.followee_saves || [])],
    ...validFields,
    // Reformat remixes last so we don't carry through any extra metadata that
    // was part of the remix_of response from backends
    remix_of: remixParentAgreementId
      ? createRemixOfMetadata({ parentAgreementId: remixParentAgreementId })
      : null
  }
}

const collectionMetadataSchema = {
  is_album: false,
  is_current: true,
  is_private: true,
  tags: null,
  genre: null,
  mood: null,
  created_at: null,
  updated_at: null,
  cover_art: null,
  cover_art_sizes: null,
  content_list_name: '',
  content_list_owner_id: null,
  save_count: null,
  license: null,
  upc: null,
  description: null
}

export const newCollectionMetadata = (fields, validate = false) => {
  const validFields = validate
    ? pick(
        fields,
        Object.keys(collectionMetadataSchema).concat(['content_list_id'])
      )
    : fields
  return {
    ...collectionMetadataSchema,
    ...validFields
  }
}

const userMetadataSchema = {
  wallet: '',
  name: null,
  handle: '',
  profile_picture: null,
  profile_picture_sizes: null,
  cover_photo_sizes: null,
  cover_photo: null,
  bio: null,
  location: null,
  is_verified: false,
  content_node_endpoint: null,
  updated_at: null,
  associated_wallets: null,
  associated_sol_wallets: null,
  collectibles: null,
  content_list_library: null,
  events: null,
  is_deactivated: false
}

export const newUserMetadata = (fields, validate = false) => {
  const validFields = validate
    ? pick(fields, Object.keys(userMetadataSchema).concat(['user_id']))
    : fields
  return {
    ...userMetadataSchema,
    ...validFields
  }
}
