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

export const getAgreementDefaults = (heroAgreement: DigitalContent | null) => ({
  title: emptyStringGuard(heroAgreement?.title),
  agreementId: heroAgreement?.digital_content_id ?? 0,
  coverArtSizes: heroAgreement?._cover_art_sizes ?? null,
  tags: emptyStringGuard(heroAgreement?.tags),
  description: emptyStringGuard(heroAgreement?.description),
  playCount: heroAgreement?.play_count ?? 0,
  duration: heroAgreement?.duration ?? 0,
  released: emptyStringGuard(heroAgreement?.release_date || heroAgreement?.created_at),
  credits: emptyStringGuard(heroAgreement?.credits_splits),
  genre: emptyStringGuard(heroAgreement?.genre),
  mood: emptyStringGuard(heroAgreement?.mood),
  repostCount: heroAgreement?.repost_count ?? 0,
  saveCount: heroAgreement?.save_count ?? 0,
  isUnlisted: heroAgreement?.is_unlisted ?? false,
  isPublishing: heroAgreement?._is_publishing ?? false,
  fieldVisibility: {
    ...defaultFieldVisibility,
    ...(heroAgreement?.field_visibility ?? {})
  },
  coSign: heroAgreement?._co_sign ?? null,
  remixAgreementIds: heroAgreement?._remixes?.map(({ digital_content_id }) => digital_content_id) ?? null,
  remixesCount: heroAgreement?._remixes_count ?? null,
  remixParentAgreementId: heroAgreement?.remix_of?.agreements?.[0]?.parent_digital_content_id,
  download: heroAgreement?.download ?? null
})
