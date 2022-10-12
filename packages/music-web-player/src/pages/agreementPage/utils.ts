import { DigitalContent } from '@coliving/common'

// return the original string if it exists, or ''
export const emptyStringGuard = (str: string | null | undefined) => str ?? ''

export const defaultFieldVisibility = {
  genre: true,
  mood: true,
  tags: true,
  share: true,
  play_count: true,
  remixes: true
}

export const getDigitalContentDefaults = (heroDigitalContent: DigitalContent | null) => ({
  title: emptyStringGuard(heroDigitalContent?.title),
  digitalContentId: heroDigitalContent?.digital_content_id ?? 0,
  coverArtSizes: heroDigitalContent?._cover_art_sizes ?? null,
  tags: emptyStringGuard(heroDigitalContent?.tags),
  description: emptyStringGuard(heroDigitalContent?.description),
  playCount: heroDigitalContent?.play_count ?? 0,
  duration: heroDigitalContent?.duration ?? 0,
  released: emptyStringGuard(heroDigitalContent?.release_date || heroDigitalContent?.created_at),
  credits: emptyStringGuard(heroDigitalContent?.credits_splits),
  genre: emptyStringGuard(heroDigitalContent?.genre),
  mood: emptyStringGuard(heroDigitalContent?.mood),
  repostCount: heroDigitalContent?.repost_count ?? 0,
  saveCount: heroDigitalContent?.save_count ?? 0,
  isUnlisted: heroDigitalContent?.is_unlisted ?? false,
  isPublishing: heroDigitalContent?._is_publishing ?? false,
  fieldVisibility: {
    ...defaultFieldVisibility,
    ...(heroDigitalContent?.field_visibility ?? {})
  },
  coSign: heroDigitalContent?._co_sign ?? null,
  remixDigitalContentIds: heroDigitalContent?._remixes?.map(({ digital_content_id }) => digital_content_id) ?? null,
  remixesCount: heroDigitalContent?._remixes_count ?? null,
  remixParentDigitalContentId: heroDigitalContent?.remix_of?.digitalContents?.[0]?.parent_digital_content_id,
  download: heroDigitalContent?.download ?? null
})
