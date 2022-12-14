/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {
  SOLANA_LISTEN_ENABLED = 'solana_listen_enabled',
  CONTENT_LIST_UPDATES_ENABLED = 'content_list_updates_enabled',
  SHARE_SOUND_TO_TIKTOK = 'share_sound_to_tiktok',
  CHALLENGE_REWARDS_UI = 'challenge_rewards_ui',
  SOL_WALLET_DGC_ENABLED = 'sol_wallet_digitalcoin_enabled',
  SURFACE_DGC_ENABLED = 'surface_digitalcoin_enabled',
  PREFER_HIGHER_PATCH_FOR_PRIMARY = 'prefer_higher_patch_for_primary',
  PREFER_HIGHER_PATCH_FOR_SECONDARIES = 'prefer_higher_patch_for_secondaries',
  ENABLE_SPL_DGC = 'enable_spl_digitalcoin',
  CONTENT_LIST_FOLDERS = 'content_list_folders',
  DISABLE_SIGN_UP_CONFIRMATION = 'disable_sign_up_confirmation',
  TIPPING_ENABLED = 'tipping_enabled',
  WRITE_QUORUM_ENABLED = 'write_quorum_enabled'
}

/**
 * If optimizely errors, these default values are used.
 */
export const flagDefaults: { [key in FeatureFlags]: boolean } = {
  [FeatureFlags.SOLANA_LISTEN_ENABLED]: false,
  [FeatureFlags.CONTENT_LIST_UPDATES_ENABLED]: false,
  [FeatureFlags.SHARE_SOUND_TO_TIKTOK]: false,
  [FeatureFlags.CHALLENGE_REWARDS_UI]: false,
  [FeatureFlags.SOL_WALLET_DGC_ENABLED]: false,
  [FeatureFlags.SURFACE_DGC_ENABLED]: false,
  [FeatureFlags.PREFER_HIGHER_PATCH_FOR_PRIMARY]: true,
  [FeatureFlags.PREFER_HIGHER_PATCH_FOR_SECONDARIES]: true,
  [FeatureFlags.ENABLE_SPL_DGC]: false,
  [FeatureFlags.CONTENT_LIST_FOLDERS]: false,
  [FeatureFlags.DISABLE_SIGN_UP_CONFIRMATION]: false,
  [FeatureFlags.TIPPING_ENABLED]: false,
  [FeatureFlags.WRITE_QUORUM_ENABLED]: false
}

export enum FeatureFlagCohortType {
  /**
   * Segments feature experiments by a user's id. If userId is not present,
   * the feature is off.
   */
  USER_ID = 'user_id',
  /**
   * Segments feature experiments by a random uuid set in local storage defined by FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY.
   * There should always be a value for sessionId. This is managed in Provider.ts
   */
  SESSION_ID = 'session_id'
}

export const flagCohortType: {
  [key in FeatureFlags]: FeatureFlagCohortType
} = {
  [FeatureFlags.SOLANA_LISTEN_ENABLED]: FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.CONTENT_LIST_UPDATES_ENABLED]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.SHARE_SOUND_TO_TIKTOK]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.CHALLENGE_REWARDS_UI]: FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.SOL_WALLET_DGC_ENABLED]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.SURFACE_DGC_ENABLED]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.PREFER_HIGHER_PATCH_FOR_PRIMARY]:
    FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.PREFER_HIGHER_PATCH_FOR_SECONDARIES]:
    FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.ENABLE_SPL_DGC]: FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.CONTENT_LIST_FOLDERS]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.DISABLE_SIGN_UP_CONFIRMATION]: FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.TIPPING_ENABLED]: FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.WRITE_QUORUM_ENABLED]: FeatureFlagCohortType.SESSION_ID
}
