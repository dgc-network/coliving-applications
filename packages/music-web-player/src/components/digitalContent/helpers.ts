import { Collection, FieldVisibility, DigitalContent, User } from '@coliving/common'

const defaultFieldVisibility: FieldVisibility = {
  genre: true,
  mood: true,
  tags: true,
  share: true,
  play_count: true,
  remixes: true
}

export const getDigitalContentWithFallback = (digital_content: DigitalContent | null) => {
  return (
    digital_content || {
      digital_content_id: -1,
      title: '',
      permalink: '',
      repost_count: 0,
      followee_reposts: [],
      followee_saves: [],
      duration: 0,
      save_count: 0,
      field_visibility: defaultFieldVisibility,
      has_current_user_reposted: false,
      has_current_user_saved: false,
      play_count: 0,
      is_delete: false,
      is_unlisted: false,
      activity_timestamp: '',
      _co_sign: undefined,
      _cover_art_sizes: {
        '150x150': '',
        '480x480': '',
        '1000x1000': '',
        OVERRIDE: ''
      }
    }
  )
}

export const getCollectionWithFallback = (collection: Collection | null) => {
  return (
    collection || {
      content_list_id: -1,
      content_list_name: '',
      repost_count: 0,
      save_count: 0,
      digital_content_ids: [],
      digital_content_count: 0,
      followee_reposts: [],
      followee_saves: [],
      has_current_user_reposted: false,
      has_current_user_saved: false,
      is_private: true,
      is_album: false,
      is_delete: false,
      activity_timestamp: '',
      _co_sign: undefined,
      content_list_owner_id: -1,
      _cover_art_sizes: {
        '150x150': '',
        '480x480': '',
        '1000x1000': '',
        OVERRIDE: ''
      }
    }
  )
}

export const getUserWithFallback = (user: User | null) => {
  return (
    user || {
      _landlord_pick: -1,
      name: '',
      handle: '',
      is_verified: false,
      is_deactivated: false,
      user_id: -1
    }
  )
}
