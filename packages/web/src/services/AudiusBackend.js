/* globals web3 */
import {
  Name,
  FailureReason,
  FeedFilter,
  DefaultSizes,
  IntKeys,
  StringKeys,
  BooleanKeys,
  FeatureFlags,
  uuid
} from '@coliving/common'
import { IdentityAPI, DiscoveryAPI } from '@coliving/sdk/dist/core'
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js'
import BN from 'bn.js'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import placeholderCoverArt from 'assets/img/imageBlank2x.png'
import imageCoverPhotoBlank from 'assets/img/imageCoverPhotoBlank.jpg'
import placeholderProfilePicture from 'assets/img/imageProfilePicEmpty2X.png'
import CIDCache from 'common/store/cache/CIDCache'
import * as schemas from 'schemas'
import { ClientRewardsReporter } from 'services/coliving-backend/Rewards'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { IS_MOBILE_USER_KEY } from 'store/account/mobileSagas'
import { agreement } from 'store/analytics/providers/amplitude'
import { isElectron } from 'utils/clientUtil'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'
import { Timer } from 'utils/performance'
import { encodeHashId } from 'utils/route/hashIds'

import {
  waitForLibsInit,
  withEagerOption,
  LIBS_INITTED_EVENT
} from './coliving-backend/eagerLoadUtils'
import { monitoringCallbacks } from './serviceMonitoring'
dayjs.extend(utc)
dayjs.extend(timezone)

const { getRemoteVar, waitForRemoteConfig } = remoteConfigInstance

export const IDENTITY_SERVICE = process.env.REACT_APP_IDENTITY_SERVICE
export const USER_NODE = process.env.REACT_APP_USER_NODE
export const LEGACY_USER_NODE = process.env.REACT_APP_LEGACY_USER_NODE

const REGISTRY_ADDRESS = process.env.REACT_APP_REGISTRY_ADDRESS
const WEB3_PROVIDER_URLS = (
  process.env.REACT_APP_WEB3_PROVIDER_URL || ''
).split(',')
const WEB3_NETWORK_ID = process.env.REACT_APP_WEB3_NETWORK_ID

const ETH_REGISTRY_ADDRESS = process.env.REACT_APP_ETH_REGISTRY_ADDRESS
const ETH_TOKEN_ADDRESS = process.env.REACT_APP_ETH_TOKEN_ADDRESS
const ETH_OWNER_WALLET = process.env.REACT_APP_ETH_OWNER_WALLET
const ETH_PROVIDER_URLS = (process.env.REACT_APP_ETH_PROVIDER_URL || '').split(
  ','
)
const CLAIM_DISTRIBUTION_CONTRACT_ADDRESS =
  process.env.REACT_APP_CLAIM_DISTRIBUTION_CONTRACT_ADDRESS

// Solana Config
const SOLANA_CLUSTER_ENDPOINT = process.env.REACT_APP_SOLANA_CLUSTER_ENDPOINT
const WLIVE_MINT_ADDRESS = process.env.REACT_APP_WLIVE_MINT_ADDRESS
const SOLANA_TOKEN_ADDRESS = process.env.REACT_APP_SOLANA_TOKEN_PROGRAM_ADDRESS
const CLAIMABLE_TOKEN_PDA = process.env.REACT_APP_CLAIMABLE_TOKEN_PDA
const SOLANA_FEE_PAYER_ADDRESS = process.env.REACT_APP_SOLANA_FEE_PAYER_ADDRESS

const CLAIMABLE_TOKEN_PROGRAM_ADDRESS =
  process.env.REACT_APP_CLAIMABLE_TOKEN_PROGRAM_ADDRESS
const WORMHOLE_ADDRESS = process.env.REACT_APP_WORMHOLE_ADDRESS
const REWARDS_MANAGER_PROGRAM_ID =
  process.env.REACT_APP_REWARDS_MANAGER_PROGRAM_ID
const REWARDS_MANAGER_PROGRAM_PDA =
  process.env.REACT_APP_REWARDS_MANAGER_PROGRAM_PDA
const REWARDS_MANAGER_TOKEN_PDA =
  process.env.REACT_APP_REWARDS_MANAGER_TOKEN_PDA

// Solana Anchor Coliving Data
const REACT_APP_ANCHOR_PROGRAM_ID = process.env.REACT_APP_ANCHOR_PROGRAM_ID
const REACT_APP_ANCHOR_ADMIN_ACCOUNT =
  process.env.REACT_APP_ANCHOR_ADMIN_ACCOUNT

// Wormhole Config
const WORMHOLE_RPC_HOSTS = process.env.REACT_APP_WORMHOLE_RPC_HOSTS
const ETH_BRIDGE_ADDRESS = process.env.REACT_APP_ETH_BRIDGE_ADDRESS
const SOL_BRIDGE_ADDRESS = process.env.REACT_APP_SOL_BRIDGE_ADDRESS
const ETH_TOKEN_BRIDGE_ADDRESS = process.env.REACT_APP_ETH_TOKEN_BRIDGE_ADDRESS
const SOL_TOKEN_BRIDGE_ADDRESS = process.env.REACT_APP_SOL_TOKEN_BRIDGE_ADDRESS

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY

const SEARCH_MAX_SAVED_RESULTS = 10
const SEARCH_MAX_TOTAL_RESULTS = 50
const IMAGE_CACHE_MAX_SIZE = 200

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE === 'true'
const COLIVING_ORIGIN = `${process.env.REACT_APP_PUBLIC_PROTOCOL}//${process.env.REACT_APP_PUBLIC_HOSTNAME}`

export const AuthHeaders = Object.freeze({
  Message: 'Encoded-Data-Message',
  Signature: 'Encoded-Data-Signature'
})

export const waitForWeb3 = async () => {
  if (!window.web3Loaded) {
    await new Promise((resolve) => {
      const onLoad = () => {
        window.removeEventListener('WEB3_LOADED', onLoad)
        resolve()
      }
      window.addEventListener('WEB3_LOADED', onLoad)
    })
  }
}

let ColivingLibs = null
export let Utils = null
let SanityChecks = null
let SolanaUtils = null

let colivingLibs = null
const unauthenticatedUuid = uuid()
/**
 * Combines two lists by concatting `maxSaved` results from the `savedList` onto the head of `normalList`,
 * ensuring that no item is duplicated in the resulting list (deduped by `uniqueKey`). The final list length is capped
 * at `maxTotal` items.
 */
const combineLists = (
  savedList,
  normalList,
  uniqueKey,
  maxSaved = SEARCH_MAX_SAVED_RESULTS,
  maxTotal = SEARCH_MAX_TOTAL_RESULTS
) => {
  const truncatedSavedList = savedList.slice(
    0,
    Math.min(maxSaved, savedList.length)
  )
  const saveListsSet = new Set(truncatedSavedList.map((s) => s[uniqueKey]))
  const filteredList = normalList.filter((n) => !saveListsSet.has(n[uniqueKey]))
  const combinedLists = savedList.concat(filteredList)
  return combinedLists.slice(0, Math.min(maxTotal, combinedLists.length))
}

const notDeleted = (e) => !e.is_delete

/**
 *
 * @param {number} cid
 * @param {string[]} creatorNodeGateways
 * @param {boolean} cache
 * @param {boolean} asUrl
 * @param {Nullable<number>} agreementId
 * @returns {Promise<string>}
 */
export const fetchCID = async (
  cid,
  creatorNodeGateways = [],
  cache = true,
  asUrl = true,
  agreementId = null
) => {
  await waitForLibsInit()
  try {
    const res = await colivingLibs.File.fetchCID(
      cid,
      creatorNodeGateways,
      () => {},
      // If requesting a url (we mean a blob url for the file),
      // otherwise, default to JSON
      asUrl ? 'blob' : 'json',
      agreementId
    )
    if (asUrl) {
      const url = URL.createObjectURL(res.data)
      if (cache) CIDCache.add(cid, url)
      return url
    }
    return res?.data ?? null
  } catch (e) {
    if (e?.message === 'Unauthorized') {
      return e.message
    }
    console.error(e)
    return asUrl ? '' : null
  }
}

let preloadImageTimer
const avoidGC = []

const preloadImage = async (url) => {
  if (!preloadImageTimer) {
    const batchSize = getRemoteVar(
      IntKeys.IMAGE_QUICK_FETCH_PERFORMANCE_BATCH_SIZE
    )

    preloadImageTimer = new Timer({
      name: 'image_preload',
      batch: true,
      batchSize
    })
  }

  return new Promise((resolve) => {
    const start = preloadImageTimer.start()

    const timeoutMs = getRemoteVar(IntKeys.IMAGE_QUICK_FETCH_TIMEOUT_MS)
    const timeout = setTimeout(() => {
      preloadImageTimer.end(start)
      resolve(false)
    }, timeoutMs)

    // Avoid garbage collection by keeping a few images in an in-mem array
    const image = new Image()
    avoidGC.push(image)
    if (avoidGC.length > IMAGE_CACHE_MAX_SIZE) avoidGC.shift()

    image.onload = () => {
      preloadImageTimer.end(start)
      clearTimeout(timeout)
      resolve(url)
    }

    image.onerror = () => {
      preloadImageTimer.end(start)
      clearTimeout(timeout)
      resolve(false)
    }
    image.src = url
  })
}

const fetchImageCID = async (cid, creatorNodeGateways = [], cache = true) => {
  if (CIDCache.has(cid)) {
    return CIDCache.get(cid)
  }

  creatorNodeGateways.push(`${USER_NODE}/ipfs`)
  const primary = creatorNodeGateways[0]
  if (primary) {
    // Attempt to fetch/load the image using the first content node gateway
    const firstImageUrl = `${primary}${cid}`
    const preloadedImageUrl = await preloadImage(firstImageUrl)

    // If the image is loaded, add to cache and return
    if (preloadedImageUrl && cache) CIDCache.add(cid, preloadedImageUrl)
    if (preloadedImageUrl) return preloadedImageUrl
  }

  await waitForLibsInit()
  // Else, race fetching of the image from all gateways & return the image url blob
  try {
    const image = await colivingLibs.File.fetchCID(
      cid,
      creatorNodeGateways,
      () => {}
    )

    const url = NATIVE_MOBILE
      ? image.config.url
      : URL.createObjectURL(image.data)

    if (cache) CIDCache.add(cid, url)

    return url
  } catch (e) {
    console.error(e)
    return ''
  }
}

class ColivingBackend {
  static currentDiscoveryProvider = null
  static didSelectDiscoveryProviderListeners = []

  static addDiscoveryProviderSelectionListener(listener) {
    ColivingBackend.didSelectDiscoveryProviderListeners.push(listener)
    if (ColivingBackend.currentDiscoveryProvider !== null) {
      listener(ColivingBackend.currentDiscoveryProvider)
    }
  }

  static async getImageUrl(cid, size, gateways) {
    if (!cid) return ''
    try {
      return size
        ? fetchImageCID(`${cid}/${size}.jpg`, gateways)
        : fetchImageCID(cid, gateways)
    } catch (e) {
      console.error(e)
      return ''
    }
  }

  static getAgreementImages(agreement) {
    const coverArtSizes = {}
    if (!agreement.cover_art_sizes && !agreement.cover_art) {
      coverArtSizes[DefaultSizes.OVERRIDE] = placeholderCoverArt
    }

    return {
      ...agreement,
      // TODO: This method should be renamed as it does more than images.
      duration: agreement.agreement_segments.reduce(
        (duration, segment) => duration + parseFloat(segment.duration),
        0
      ),
      _cover_art_sizes: coverArtSizes
    }
  }

  static getCollectionImages(collection) {
    const coverArtSizes = {}

    if (
      collection.content list_image_sizes_multihash &&
      !collection.cover_art_sizes
    ) {
      collection.cover_art_sizes = collection.content list_image_sizes_multihash
    }
    if (collection.content list_image_multihash && !collection.cover_art) {
      collection.cover_art = collection.content list_image_multihash
    }

    if (!collection.cover_art_sizes && !collection.cover_art) {
      coverArtSizes[DefaultSizes.OVERRIDE] = placeholderCoverArt
    }

    return {
      ...collection,
      _cover_art_sizes: coverArtSizes
    }
  }

  static getUserImages(user) {
    const profilePictureSizes = {}
    const coverPhotoSizes = {}

    // Images are fetched on demand async w/ the `useUserProfilePicture`/`useUserCoverPhoto` and
    // transitioned in w/ the dynamicImageComponent
    if (!user.profile_picture_sizes && !user.profile_picture) {
      profilePictureSizes[DefaultSizes.OVERRIDE] = placeholderProfilePicture
    }

    if (!user.cover_photo_sizes && !user.cover_photo) {
      coverPhotoSizes[DefaultSizes.OVERRIDE] = imageCoverPhotoBlank
    }

    return {
      ...user,
      _profile_picture_sizes: profilePictureSizes,
      _cover_photo_sizes: coverPhotoSizes
    }
  }

  // Record the endpoint and reason for selecting the endpoint
  static discoveryProviderSelectionCallback(endpoint, decisionTree) {
    agreement(Name.DISCOVERY_PROVIDER_SELECTION, {
      endpoint,
      reason: decisionTree.map((reason) => reason.stage).join(' -> ')
    })
    ColivingBackend.didSelectDiscoveryProviderListeners.forEach((listener) =>
      listener(endpoint)
    )
  }

  static creatorNodeSelectionCallback(primary, secondaries, reason) {
    agreement(Name.CONTENT_NODE_SELECTION, {
      endpoint: primary,
      selectedAs: 'primary',
      reason
    })
    secondaries.forEach((secondary) => {
      agreement(Name.CONTENT_NODE_SELECTION, {
        endpoint: secondary,
        selectedAs: 'secondary',
        reason
      })
    })
  }

  static async sanityChecks(colivingLibs) {
    try {
      const sanityCheckOptions = {
        skipRollover: getRemoteVar(BooleanKeys.SKIP_ROLLOVER_NODES_SANITY_CHECK)
      }
      const sanityChecks = new SanityChecks(colivingLibs, sanityCheckOptions)
      await sanityChecks.run()
    } catch (e) {
      console.error(`Sanity checks failed: ${e}`)
    }
  }

  static async setup() {
    // Wait for web3 to load if necessary
    await waitForWeb3()
    // Wait for optimizely to load if necessary
    await waitForRemoteConfig()

    const { libs } = await import('./coliving-backend/ColivingLibsLazyLoader')

    ColivingLibs = libs
    Utils = libs.Utils
    SanityChecks = libs.SanityChecks
    SolanaUtils = libs.SolanaUtils

    // initialize libs
    let libsError = null
    const { web3Error, web3Config } = await ColivingBackend.getWeb3Config()
    const { ethWeb3Config } = ColivingBackend.getEthWeb3Config()
    const { solanaWeb3Config } = ColivingBackend.getSolanaWeb3Config()
    const { solanaColivingDataConfig } = ColivingBackend.getSolanaColivingDataConfig()
    const { wormholeConfig } = ColivingBackend.getWormholeConfig()

    let contentNodeBlockList = getRemoteVar(StringKeys.CONTENT_NODE_BLOCK_LIST)
    if (contentNodeBlockList) {
      try {
        contentNodeBlockList = new Set(contentNodeBlockList.split(','))
      } catch (e) {
        console.error(e)
        contentNodeBlockList = null
      }
    }
    let discoveryNodeBlockList = getRemoteVar(
      StringKeys.DISCOVERY_NODE_BLOCK_LIST
    )
    if (discoveryNodeBlockList) {
      try {
        discoveryNodeBlockList = new Set(discoveryNodeBlockList.split(','))
      } catch (e) {
        console.error(e)
        discoveryNodeBlockList = null
      }
    }

    try {
      colivingLibs = new ColivingLibs({
        web3Config,
        ethWeb3Config,
        solanaWeb3Config,
        solanaColivingDataConfig,
        wormholeConfig,
        discoveryProviderConfig: {
          blacklist: discoveryNodeBlockList,
          reselectTimeout: getRemoteVar(
            IntKeys.DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS
          ),
          selectionCallback: ColivingBackend.discoveryProviderSelectionCallback,
          monitoringCallbacks: monitoringCallbacks.discoveryNode,
          selectionRequestTimeout: getRemoteVar(
            IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_TIMEOUT
          ),
          selectionRequestRetries: getRemoteVar(
            IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_RETRIES
          ),
          unhealthySlotDiffPlays: getRemoteVar(
            IntKeys.DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS
          ),
          unhealthyBlockDiff: getRemoteVar(
            IntKeys.DISCOVERY_NODE_MAX_BLOCK_DIFF
          )
        },
        identityServiceConfig:
          ColivingLibs.configIdentityService(IDENTITY_SERVICE),
        creatorNodeConfig: ColivingLibs.configCreatorNode(
          USER_NODE,
          /* lazyConnect */ true,
          /* passList */ null,
          contentNodeBlockList,
          monitoringCallbacks.contentNode,
          /* writeQuorumEnabled */ getFeatureEnabled(
            FeatureFlags.WRITE_QUORUM_ENABLED
          )
        ),
        // Electron cannot use captcha until it serves its assets from
        // a "domain" (e.g. localhost) rather than the file system itself.
        // i.e. there is no way to instruct captcha that the domain is "file://"
        captchaConfig: isElectron()
          ? undefined
          : { siteKey: RECAPTCHA_SITE_KEY },
        isServer: false,
        preferHigherPatchForPrimary: getFeatureEnabled(
          FeatureFlags.PREFER_HIGHER_PATCH_FOR_PRIMARY
        ),
        preferHigherPatchForSecondaries: getFeatureEnabled(
          FeatureFlags.PREFER_HIGHER_PATCH_FOR_SECONDARIES
        )
      })
      await colivingLibs.init()
      window.colivingLibs = colivingLibs
      const event = new CustomEvent(LIBS_INITTED_EVENT)
      window.dispatchEvent(event)

      ColivingBackend.sanityChecks(colivingLibs)
    } catch (err) {
      console.log(err)
      libsError = err.message
    }

    // Web3Error allows for metamask to be improperly configured
    // but reads to still work in app. libsError should be treated as fatal.
    return { web3Error, libsError }
  }

  static getEthWeb3Config() {
    const ethProviderUrls =
      getRemoteVar(StringKeys.ETH_PROVIDER_URLS) || ETH_PROVIDER_URLS
    return {
      ethWeb3Config: ColivingLibs.configEthWeb3(
        ETH_TOKEN_ADDRESS,
        ETH_REGISTRY_ADDRESS,
        ethProviderUrls,
        ETH_OWNER_WALLET,
        CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
        WORMHOLE_ADDRESS
      )
    }
  }

  static async getWeb3Config() {
    const useMetaMaskSerialized = localStorage.getItem('useMetaMask')
    const useMetaMask = useMetaMaskSerialized
      ? JSON.parse(useMetaMaskSerialized)
      : false

    if (useMetaMask && window.web3) {
      try {
        return {
          error: false,
          web3Config: await ColivingLibs.configExternalWeb3(
            REGISTRY_ADDRESS,
            web3.currentProvider,
            WEB3_NETWORK_ID
          )
        }
      } catch (e) {
        return {
          error: true,
          web3Config: ColivingLibs.configInternalWeb3(
            REGISTRY_ADDRESS,
            WEB3_PROVIDER_URLS
          )
        }
      }
    }
    return {
      error: false,
      web3Config: ColivingLibs.configInternalWeb3(
        REGISTRY_ADDRESS,
        WEB3_PROVIDER_URLS
      )
    }
  }

  static getSolanaWeb3Config() {
    if (
      !SOLANA_CLUSTER_ENDPOINT ||
      !WLIVE_MINT_ADDRESS ||
      !SOLANA_TOKEN_ADDRESS ||
      !SOLANA_FEE_PAYER_ADDRESS ||
      !CLAIMABLE_TOKEN_PROGRAM_ADDRESS ||
      !REWARDS_MANAGER_PROGRAM_ID ||
      !REWARDS_MANAGER_PROGRAM_PDA ||
      !REWARDS_MANAGER_TOKEN_PDA
    ) {
      console.error('Missing solana configs')
      return {
        error: true
      }
    }
    return {
      error: false,
      solanaWeb3Config: ColivingLibs.configSolanaWeb3({
        solanaClusterEndpoint: SOLANA_CLUSTER_ENDPOINT,
        mintAddress: WLIVE_MINT_ADDRESS,
        solanaTokenAddress: SOLANA_TOKEN_ADDRESS,
        claimableTokenPDA: CLAIMABLE_TOKEN_PDA,
        feePayerAddress: SOLANA_FEE_PAYER_ADDRESS,
        claimableTokenProgramAddress: CLAIMABLE_TOKEN_PROGRAM_ADDRESS,
        rewardsManagerProgramId: REWARDS_MANAGER_PROGRAM_ID,
        rewardsManagerProgramPDA: REWARDS_MANAGER_PROGRAM_PDA,
        rewardsManagerTokenPDA: REWARDS_MANAGER_TOKEN_PDA,
        useRelay: true
      })
    }
  }

  static getSolanaColivingDataConfig() {
    if (!REACT_APP_ANCHOR_PROGRAM_ID || !REACT_APP_ANCHOR_ADMIN_ACCOUNT) {
      console.warn('Missing solana coliving data config')
      return {
        error: true
      }
    }

    return {
      error: false,
      solanaColivingDataConfig: ColivingLibs.configSolanaColivingData({
        programId: REACT_APP_ANCHOR_PROGRAM_ID,
        adminAccount: REACT_APP_ANCHOR_ADMIN_ACCOUNT
      })
    }
  }

  static getWormholeConfig() {
    if (
      !WORMHOLE_RPC_HOSTS ||
      !ETH_BRIDGE_ADDRESS ||
      !SOL_BRIDGE_ADDRESS ||
      !ETH_TOKEN_BRIDGE_ADDRESS ||
      !SOL_TOKEN_BRIDGE_ADDRESS
    ) {
      console.error('Missing wormhole configs')
      return {
        error: true
      }
    }

    return {
      error: false,
      wormholeConfig: ColivingLibs.configWormhole({
        rpcHosts: WORMHOLE_RPC_HOSTS,
        solBridgeAddress: SOL_BRIDGE_ADDRESS,
        solTokenBridgeAddress: SOL_TOKEN_BRIDGE_ADDRESS,
        ethBridgeAddress: ETH_BRIDGE_ADDRESS,
        ethTokenBridgeAddress: ETH_TOKEN_BRIDGE_ADDRESS
      })
    }
  }

  static async setCreatorNodeEndpoint(endpoint) {
    return colivingLibs.creatorNode.setEndpoint(endpoint)
  }

  static async isCreatorNodeSyncing(endpoint) {
    try {
      const { isBehind, isConfigured } =
        await colivingLibs.creatorNode.getSyncStatus(endpoint)
      return isBehind && isConfigured
    } catch (e) {
      return true
    }
  }

  static async listCreatorNodes() {
    return colivingLibs.ServiceProvider.listCreatorNodes()
  }

  static async autoSelectCreatorNodes() {
    return colivingLibs.ServiceProvider.autoSelectCreatorNodes({})
  }

  static async getSelectableCreatorNodes() {
    let contentNodeBlockList = getRemoteVar(StringKeys.CONTENT_NODE_BLOCK_LIST)
    if (contentNodeBlockList) {
      try {
        contentNodeBlockList = new Set(contentNodeBlockList.split(','))
      } catch (e) {
        console.error(e)
        contentNodeBlockList = null
      }
    }
    return colivingLibs.ServiceProvider.getSelectableCreatorNodes(
      /* whitelist */ null,
      /* blacklist */ contentNodeBlockList
    )
  }

  static async getAccount(fromSource = false) {
    await waitForLibsInit()
    try {
      let account
      if (fromSource) {
        const wallet = colivingLibs.Account.getCurrentUser().wallet
        account = await colivingLibs.discoveryProvider.getUserAccount(wallet)
        colivingLibs.userStateManager.setCurrentUser(account)
      } else {
        account = colivingLibs.Account.getCurrentUser()
        if (!account) return null
      }
      try {
        const body = await ColivingBackend.getCreatorSocialHandle(account.handle)
        account.twitter_handle = body.twitterHandle || null
        account.instagram_handle = body.instagramHandle || null
        account.tiktok_handle = body.tikTokHandle || null
        account.website = body.website || null
        account.donation = body.donation || null
        account._artist_pick = body.pinnedAgreementId || null
        account.twitterVerified = body.twitterVerified || false
        account.instagramVerified = body.instagramVerified || false
      } catch (e) {
        console.error(e)
      }
      try {
        const userBank = await colivingLibs.solanaWeb3Manager.getUserBank()
        account.userBank = userBank.toString()
        return ColivingBackend.getUserImages(account)
      } catch (e) {
        // Failed to fetch solana user bank account for user
        // in any case
        console.error(e)
        return ColivingBackend.getUserImages(account)
      }
    } catch (e) {
      console.error(e)
      // No account
      return null
    }
  }

  static async getAllAgreements({
    offset,
    limit,
    idsArray,
    withUsers = true,
    filterDeletes = false
  }) {
    try {
      const agreements = await withEagerOption(
        {
          normal: (libs) => libs.Agreement.getAgreements,
          eager: DiscoveryAPI.getAgreements
        },
        limit,
        offset,
        idsArray,
        null, // targetUserId
        null, // sort
        null, // minBlockNumber
        filterDeletes, // filterDeleted
        withUsers // withUsers
      )
      return agreements || []
    } catch (e) {
      console.error(e)
      return []
    }
  }

  /**
   * @typedef {Object} getAgreementsIdentifier
   * @property {string} handle
   * @property {number} id
   * @property {string} url_title
   */

  /**
   * gets all agreements matching identifiers, including unlisted.
   *
   * @param {getAgreementsIdentifier[]} identifiers
   * @returns {(Array)} agreement
   */
  static async getAgreementsIncludingUnlisted(identifiers, withUsers = true) {
    try {
      const agreements = await withEagerOption(
        {
          normal: (libs) => libs.Agreement.getAgreementsIncludingUnlisted,
          eager: DiscoveryAPI.getAgreementsIncludingUnlisted
        },
        identifiers,
        withUsers
      )

      return agreements
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getArtistAgreements({
    offset,
    limit,
    userId,
    sort = null,
    filterDeleted = null,
    withUsers = true
  }) {
    try {
      const agreements = await withEagerOption(
        {
          normal: (libs) => libs.Agreement.getAgreements,
          eager: DiscoveryAPI.getAgreements
        },
        limit,
        offset,
        null,
        userId,
        sort,
        null,
        filterDeleted,
        withUsers
      )
      return agreements || []
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getSocialFeed({
    filter,
    offset,
    limit,
    withUsers = true,
    agreementsOnly = false
  }) {
    const filterMap = {
      [FeedFilter.ALL]: 'all',
      [FeedFilter.ORIGINAL]: 'original',
      [FeedFilter.REPOST]: 'repost'
    }

    let feedItems = []
    try {
      feedItems = await withEagerOption(
        {
          normal: (libs) => libs.User.getSocialFeed,
          eager: DiscoveryAPI.getSocialFeed,
          requiresUser: true
        },
        filterMap[filter],
        limit,
        offset,
        withUsers,
        agreementsOnly
      )
      // It's possible all the requests timed out,
      // we need to not return a null object here.
      if (!feedItems) return []
    } catch (err) {
      console.error(err)
    }
    return feedItems.map((item) => {
      if (item.content list_id) return ColivingBackend.getCollectionImages(item)
      return item
    })
  }

  static async getUserFeed({ offset, limit, userId, withUsers = true }) {
    try {
      const agreements = await withEagerOption(
        {
          normal: (libs) => libs.User.getUserRepostFeed,
          eager: DiscoveryAPI.getUserRepostFeed
        },
        userId,
        limit,
        offset,
        withUsers
      )
      return agreements
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async searchTags({
    searchText,
    minTagThreshold,
    kind,
    offset,
    limit
  }) {
    try {
      const searchTags = await withEagerOption(
        {
          normal: (libs) => libs.Account.searchTags,
          eager: DiscoveryAPI.searchTags
        },
        searchText,
        minTagThreshold,
        kind,
        limit,
        offset
      )

      const {
        agreements = [],
        saved_agreements: savedAgreements = [],
        followed_users: followedUsers = [],
        users = []
      } = searchTags

      const combinedAgreements = await Promise.all(
        combineLists(
          savedAgreements.filter(notDeleted),
          agreements.filter(notDeleted),
          'agreement_id'
        ).map(async (agreement) => ColivingBackend.getAgreementImages(agreement))
      )

      const combinedUsers = await Promise.all(
        combineLists(followedUsers, users, 'user_id').map(async (user) =>
          ColivingBackend.getUserImages(user)
        )
      )

      return {
        agreements: combinedAgreements,
        users: combinedUsers
      }
    } catch (e) {
      console.error(e)
      return {
        agreements: [],
        users: []
      }
    }
  }

  static async getAgreementListens(agreementIds, start, end, period) {
    if (agreementIds.length === 0) return []
    try {
      return withEagerOption(
        {
          normal: (libs) => libs.Agreement.getAgreementListens,
          eager: IdentityAPI.getAgreementListens,
          endpoint: IDENTITY_SERVICE
        },
        period,
        agreementIds,
        start,
        end,
        agreementIds.length
      )
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async recordAgreementListen(agreementId) {
    try {
      const listen = await colivingLibs.Agreement.logAgreementListen(
        agreementId,
        unauthenticatedUuid,
        getFeatureEnabled(FeatureFlags.SOLANA_LISTEN_ENABLED)
      )
      return listen
    } catch (err) {
      console.error(err.message)
    }
  }

  static async repostAgreement(agreementId) {
    try {
      return colivingLibs.Agreement.addAgreementRepost(agreementId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async undoRepostAgreement(agreementId) {
    try {
      return colivingLibs.Agreement.deleteAgreementRepost(agreementId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async repostCollection(content listId) {
    try {
      return colivingLibs.Playlist.addPlaylistRepost(content listId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async undoRepostCollection(content listId) {
    try {
      return colivingLibs.Playlist.deletePlaylistRepost(content listId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  /**
   * Upgrades a user to a creator
   * @param {string} newCreatorNodeEndpoint will follow the structure 'cn1,cn2,cn3'
   */
  static async upgradeToCreator(newCreatorNodeEndpoint) {
    return colivingLibs.User.upgradeToCreator(USER_NODE, newCreatorNodeEndpoint)
  }

  // Uploads a single agreement
  // Returns { agreementId, error, phase }
  static async uploadAgreement(agreementFile, coverArtFile, metadata, onProgress) {
    return await colivingLibs.Agreement.uploadAgreement(
      agreementFile,
      coverArtFile,
      metadata,
      onProgress
    )
  }

  // Used to upload multiple agreements as part of an album/content list
  // Returns { metadataMultihash, metadataFileUUID, transcodedAgreementCID, transcodedAgreementUUID }
  static async uploadAgreementToCreatorNode(
    agreementFile,
    coverArtFile,
    metadata,
    onProgress
  ) {
    return colivingLibs.Agreement.uploadAgreementContentToCreatorNode(
      agreementFile,
      coverArtFile,
      metadata,
      onProgress
    )
  }

  static async getUserEmail() {
    await waitForLibsInit()
    const { email } = await colivingLibs.Account.getUserEmail()
    return email
  }

  /**
   * Takes an array of [{metadataMultihash, metadataFileUUID}, {}, ]
   * Adds agreements to chain for this user
   * Associates agreements with user on creatorNode
   */
  static async registerUploadedAgreements(uploadedAgreements) {
    return colivingLibs.Agreement.addAgreementsToChainAndCnode(uploadedAgreements)
  }

  static async uploadImage(file) {
    return colivingLibs.File.uploadImage(file)
  }

  static async updateAgreement(agreementId, metadata) {
    const cleanedMetadata = schemas.newAgreementMetadata(metadata, true)

    if (metadata.artwork) {
      const resp = await colivingLibs.File.uploadImage(metadata.artwork.file)
      cleanedMetadata.cover_art_sizes = resp.dirCID
    }
    return await colivingLibs.Agreement.updateAgreement(cleanedMetadata)
  }

  static async getCreators(ids) {
    try {
      if (ids.length === 0) return []
      const creators = await withEagerOption(
        {
          normal: (libs) => libs.User.getUsers,
          eager: DiscoveryAPI.getUsers
        },
        ids.length,
        0,
        ids
      )
      if (!creators) {
        return []
      }

      return Promise.all(
        creators.map(async (creator) => ColivingBackend.getUserImages(creator))
      )
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async getCreatorSocialHandle(handle) {
    try {
      const res = await fetch(
        `${IDENTITY_SERVICE}/social_handles?handle=${handle}`
      ).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  /**
   * Retrieves the user's eth associated wallets from IPFS using the user's metadata CID and content node endpoints
   * @param {User} user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  static async fetchUserAssociatedEthWallets(user) {
    const gateways = getCreatorNodeIPFSGateways(user.content_node_endpoint)
    const cid = user?.metadata_multihash ?? null
    if (cid) {
      const metadata = await fetchCID(
        cid,
        gateways,
        /* cache */ false,
        /* asUrl */ false
      )
      if (metadata?.associated_wallets) {
        return metadata.associated_wallets
      }
    }
    return null
  }

  /**
   * Retrieves the user's solana associated wallets from IPFS using the user's metadata CID and content node endpoints
   * @param {User} user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  static async fetchUserAssociatedSolWallets(user) {
    const gateways = getCreatorNodeIPFSGateways(user.content_node_endpoint)
    const cid = user?.metadata_multihash ?? null
    if (cid) {
      const metadata = await fetchCID(
        cid,
        gateways,
        /* cache */ false,
        /* asUrl */ false
      )
      if (metadata?.associated_sol_wallets) {
        return metadata.associated_sol_wallets
      }
    }
    return null
  }

  /**
   * Retrieves both the user's ETH and SOL associated wallets from the user's metadata CID
   * @param {User} user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  static async fetchUserAssociatedWallets(user) {
    const gateways = getCreatorNodeIPFSGateways(user.content_node_endpoint)
    const cid = user?.metadata_multihash ?? null
    if (cid) {
      const metadata = await fetchCID(
        cid,
        gateways,
        /* cache */ false,
        /* asUrl */ false
      )
      return {
        associated_sol_wallets: metadata?.associated_sol_wallets ?? null,
        associated_wallets: metadata?.associated_wallets ?? null
      }
    }
    return null
  }

  static async updateCreator(metadata, id) {
    let newMetadata = { ...metadata }
    const associatedWallets = await ColivingBackend.fetchUserAssociatedWallets(
      metadata
    )
    newMetadata.associated_wallets =
      newMetadata.associated_wallets || associatedWallets?.associated_wallets
    newMetadata.associated_sol_wallets =
      newMetadata.associated_sol_wallets ||
      associatedWallets?.associated_sol_wallets

    try {
      if (newMetadata.updatedProfilePicture) {
        const resp = await colivingLibs.File.uploadImage(
          newMetadata.updatedProfilePicture.file
        )
        newMetadata.profile_picture_sizes = resp.dirCID
      }

      if (newMetadata.updatedCoverPhoto) {
        const resp = await colivingLibs.File.uploadImage(
          newMetadata.updatedCoverPhoto.file,
          false
        )
        newMetadata.cover_photo_sizes = resp.dirCID
      }

      if (
        typeof newMetadata.twitter_handle === 'string' ||
        typeof newMetadata.instagram_handle === 'string' ||
        typeof newMetadata.tiktok_handle === 'string' ||
        typeof newMetadata.website === 'string' ||
        typeof newMetadata.donation === 'string'
      ) {
        const { data, signature } = await ColivingBackend.signData()
        await fetch(`${IDENTITY_SERVICE}/social_handles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({
            twitterHandle: newMetadata.twitter_handle,
            instagramHandle: newMetadata.instagram_handle,
            tikTokHandle: newMetadata.tiktok_handle,
            website: newMetadata.website,
            donation: newMetadata.donation
          })
        })
      }

      newMetadata = schemas.newUserMetadata(newMetadata, true)

      const { blockHash, blockNumber, userId } =
        await colivingLibs.User.updateCreator(newMetadata.user_id, newMetadata)
      return { blockHash, blockNumber, userId }
    } catch (err) {
      console.error(err.message)
      return false
    }
  }

  static async updateUser(metadata, id) {
    let newMetadata = { ...metadata }
    try {
      if (newMetadata.updatedProfilePicture) {
        const resp = await colivingLibs.File.uploadImage(
          newMetadata.updatedProfilePicture.file
        )
        newMetadata.profile_picture_sizes = resp.dirCID
      }

      if (newMetadata.updatedCoverPhoto) {
        const resp = await colivingLibs.File.uploadImage(
          newMetadata.updatedCoverPhoto.file,
          false
        )
        newMetadata.cover_photo_sizes = resp.dirCID
      }
      if (
        typeof newMetadata.twitter_handle === 'string' ||
        typeof newMetadata.instagram_handle === 'string' ||
        typeof newMetadata.tiktok_handle === 'string' ||
        typeof newMetadata.website === 'string' ||
        typeof newMetadata.donation === 'string'
      ) {
        await fetch(`${IDENTITY_SERVICE}/social_handles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            handle: newMetadata.handle,
            twitterHandle: newMetadata.twitter_handle,
            instagramHandle: newMetadata.instagram_handle,
            website: newMetadata.website,
            donation: newMetadata.donation
          })
        })
      }

      newMetadata = schemas.newUserMetadata(newMetadata, true)

      const { blockHash, blockNumber } = await colivingLibs.User.updateUser(
        id,
        newMetadata
      )
      return { blockHash, blockNumber }
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async updateIsVerified(userId, verified) {
    try {
      await colivingLibs.User.updateIsVerified(userId, verified)
      return true
    } catch (err) {
      console.error(err.message)
      return false
    }
  }

  static async followUser(followeeUserId) {
    try {
      return await colivingLibs.User.addUserFollow(followeeUserId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async unfollowUser(followeeUserId) {
    try {
      return await colivingLibs.User.deleteUserFollow(followeeUserId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async getFolloweeFollows(userId, limit = 100, offset = 0) {
    let followers = []
    try {
      followers = await colivingLibs.User.getMutualFollowers(
        limit,
        offset,
        userId
      )

      if (followers.length) {
        return Promise.all(
          followers.map((follower) => ColivingBackend.getUserImages(follower))
        )
      }
    } catch (err) {
      console.error(err.message)
    }

    return followers
  }

  static async getPlaylists(userId, content listIds) {
    try {
      const content lists = await withEagerOption(
        {
          normal: (libs) => libs.Playlist.getPlaylists,
          eager: DiscoveryAPI.getPlaylists
        },
        100,
        0,
        content listIds,
        userId,
        true
      )
      return (content lists || []).map(ColivingBackend.getCollectionImages)
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async createPlaylist(
    userId,
    metadata,
    isAlbum = false,
    agreementIds = [],
    isPrivate = true
  ) {
    const content listName = metadata.content list_name
    const coverArt = metadata.artwork ? metadata.artwork.file : null
    const description = metadata.description
    // Creating an album is automatically public.
    if (isAlbum) isPrivate = false

    try {
      const response = await colivingLibs.Playlist.createPlaylist(
        userId,
        content listName,
        isPrivate,
        isAlbum,
        agreementIds
      )
      let { blockHash, blockNumber, content listId, error } = response

      if (error) return { content listId, error }

      const updatePromises = []

      // If this content list is being created from an existing cover art, use it.
      if (metadata.cover_art_sizes) {
        updatePromises.push(
          colivingLibs.contracts.PlaylistFactoryClient.updatePlaylistCoverPhoto(
            content listId,
            Utils.formatOptionalMultihash(metadata.cover_art_sizes)
          )
        )
      } else if (coverArt) {
        updatePromises.push(
          colivingLibs.Playlist.updatePlaylistCoverPhoto(content listId, coverArt)
        )
      }
      if (description) {
        updatePromises.push(
          colivingLibs.Playlist.updatePlaylistDescription(content listId, description)
        )
      }

      /**
       * find the latest transaction i.e. latest block number among the return transaction receipts
       * and return that block number along with its corresponding block hash
       */
      if (updatePromises.length > 0) {
        const latestReceipt = ColivingBackend.getLatestTxReceipt(
          await Promise.all(updatePromises)
        )
        blockHash = latestReceipt.blockHash
        blockNumber = latestReceipt.blockNumber
      }

      return { blockHash, blockNumber, content listId }
    } catch (err) {
      // This code path should never execute
      console.debug('Reached client createPlaylist catch block')
      console.error(err.message)
      return { content listId: null, error: true }
    }
  }

  static async updatePlaylist(content listId, metadata) {
    const content listName = metadata.content list_name
    const coverPhoto = metadata.artwork.file
    const description = metadata.description

    try {
      let blockHash, blockNumber
      const promises = []
      if (content listName) {
        promises.push(
          colivingLibs.Playlist.updatePlaylistName(content listId, content listName)
        )
      }
      if (coverPhoto) {
        promises.push(
          colivingLibs.Playlist.updatePlaylistCoverPhoto(content listId, coverPhoto)
        )
      }
      if (description) {
        promises.push(
          colivingLibs.Playlist.updatePlaylistDescription(content listId, description)
        )
      }

      /**
       * find the latest transaction i.e. latest block number among the return transaction receipts
       * and return that block number along with its corresponding block hash
       */
      if (promises.length > 0) {
        const latestReceipt = ColivingBackend.getLatestTxReceipt(
          await Promise.all(promises)
        )
        blockHash = latestReceipt.blockHash
        blockNumber = latestReceipt.blockNumber
      }

      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async orderPlaylist(content listId, agreementIds, retries) {
    try {
      const { blockHash, blockNumber } =
        await colivingLibs.Playlist.orderPlaylistAgreements(
          content listId,
          agreementIds,
          retries
        )
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async publishPlaylist(content listId) {
    try {
      const { blockHash, blockNumber } =
        await colivingLibs.Playlist.updatePlaylistPrivacy(content listId, false)
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async addPlaylistAgreement(content listId, agreementId) {
    try {
      const { blockHash, blockNumber } =
        await colivingLibs.Playlist.addPlaylistAgreement(content listId, agreementId)
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async deletePlaylistAgreement(content listId, agreementId, timestamp, retries) {
    try {
      const { blockHash, blockNumber } =
        await colivingLibs.Playlist.deletePlaylistAgreement(
          content listId,
          agreementId,
          timestamp,
          retries
        )
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async validateAgreementsInPlaylist(content listId) {
    try {
      const { isValid, invalidAgreementIds } =
        await colivingLibs.Playlist.validateAgreementsInPlaylist(content listId)
      return { error: false, isValid, invalidAgreementIds }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  // NOTE: This is called to explicitly set a content list agreement ids w/out running validation checks.
  // This should NOT be used to set the content list order
  // It's added for the purpose of manually fixing broken content lists
  static async dangerouslySetPlaylistOrder(content listId, agreementIds) {
    try {
      await colivingLibs.contracts.PlaylistFactoryClient.orderPlaylistAgreements(
        content listId,
        agreementIds
      )
      return { error: false }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async deletePlaylist(content listId) {
    try {
      const { txReceipt } = await colivingLibs.Playlist.deletePlaylist(content listId)
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber
      }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async deleteAlbum(content listId, agreementIds) {
    try {
      console.debug(
        `Deleting Album ${content listId}, agreements: ${JSON.stringify(
          agreementIds.map((t) => t.agreement)
        )}`
      )
      const agreementDeletionPromises = agreementIds.map((t) =>
        colivingLibs.Agreement.deleteAgreement(t.agreement)
      )
      const content listDeletionPromise =
        colivingLibs.Playlist.deletePlaylist(content listId)
      const results = await Promise.all(
        agreementDeletionPromises.concat(content listDeletionPromise)
      )
      const deleteAgreementReceipts = results.slice(0, -1).map((r) => r.txReceipt)
      const deletePlaylistReceipt = results.slice(-1)[0].txReceipt

      const { blockHash, blockNumber } = ColivingBackend.getLatestTxReceipt(
        deleteAgreementReceipts.concat(deletePlaylistReceipt)
      )
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async getSavedPlaylists(limit = 100, offset = 0) {
    try {
      const saves = await withEagerOption(
        {
          normal: (libs) => libs.Playlist.getSavedPlaylists,
          eager: DiscoveryAPI.getSavedPlaylists
        },
        limit,
        offset
      )
      return saves.map((save) => save.save_item_id)
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async getSavedAlbums(limit = 100, offset = 0) {
    try {
      const saves = await withEagerOption(
        {
          normal: (libs) => libs.Playlist.getSavedAlbums,
          eager: DiscoveryAPI.getSavedAlbums
        },
        limit,
        offset
      )
      return saves.map((save) => save.save_item_id)
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async getSavedAgreements(limit = 100, offset = 0) {
    try {
      return withEagerOption(
        {
          normal: (libs) => libs.Agreement.getSavedAgreements,
          eager: DiscoveryAPI.getSavedAgreements
        },
        limit,
        offset
      )
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  // Favoriting a agreement
  static async saveAgreement(agreementId) {
    try {
      return await colivingLibs.Agreement.addAgreementSave(agreementId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async deleteAgreement(agreementId) {
    try {
      const { txReceipt } = await colivingLibs.Agreement.deleteAgreement(agreementId)
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber
      }
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  // Favorite a content list
  static async saveCollection(content listId) {
    try {
      return await colivingLibs.Playlist.addPlaylistSave(content listId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  // Unfavoriting a agreement
  static async unsaveAgreement(agreementId) {
    try {
      return await colivingLibs.Agreement.deleteAgreementSave(agreementId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  // Unfavorite a content list
  static async unsaveCollection(content listId) {
    try {
      return await colivingLibs.Playlist.deletePlaylistSave(content listId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  /**
   * Sets the artist pick for a user
   * @param {number?} agreementId if null, unsets the artist pick
   */
  static async setArtistPick(agreementId = null) {
    await waitForLibsInit()
    try {
      const { data, signature } = await ColivingBackend.signData()
      await fetch(`${IDENTITY_SERVICE}/artist_pick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({
          agreementId
        })
      })
    } catch (err) {
      console.error(err.message)
      return false
    }
  }

  static async signIn(email, password) {
    await waitForLibsInit()
    return colivingLibs.Account.login(email, password)
  }

  static async signOut() {
    await waitForLibsInit()
    return colivingLibs.Account.logout()
  }

  /**
   * @param {string} email
   * @param {string} password
   * @param {Object} formFields {name, handle, profilePicture, coverPhoto, isVerified, location}
   * @param {boolean?} hasWallet the user already has a wallet but didn't complete sign up
   * @param {ID?} referrer the user_id of the account that referred this one
   */
  static async signUp({
    email,
    password,
    formFields,
    hasWallet = false,
    referrer = null,
    feePayerOverride = null
  }) {
    await waitForLibsInit()
    const metadata = schemas.newUserMetadata()
    if (formFields.name) {
      metadata.name = formFields.name
    }
    if (formFields.handle) {
      metadata.handle = formFields.handle
    }
    if (formFields.isVerified) {
      metadata.is_verified = formFields.isVerified
    }
    if (formFields.location) {
      metadata.location = formFields.location
    }

    const hasEvents = referrer || NATIVE_MOBILE
    if (hasEvents) {
      metadata.events = {}
    }
    if (referrer) {
      metadata.events.referrer = referrer
    }
    if (NATIVE_MOBILE) {
      metadata.events.is_mobile_user = true
      window.localStorage.setItem(IS_MOBILE_USER_KEY, 'true')
    }

    // Returns { userId, error, phase }
    return colivingLibs.Account.signUp(
      email,
      password,
      metadata,
      formFields.profilePicture,
      formFields.coverPhoto,
      hasWallet,
      ColivingBackend._getHostUrl(),
      agreement,
      {
        Request: Name.CREATE_USER_BANK_REQUEST,
        Success: Name.CREATE_USER_BANK_SUCCESS,
        Failure: Name.CREATE_USER_BANK_FAILURE
      },
      feePayerOverride
    )
  }

  static async resetPassword(email, password) {
    await waitForLibsInit()
    return colivingLibs.Account.resetPassword(email, password)
  }

  static async changePassword(email, password, oldpassword) {
    await waitForLibsInit()
    return colivingLibs.Account.changePassword(email, password, oldpassword)
  }

  static async confirmCredentials(email, password) {
    await waitForLibsInit()
    return colivingLibs.Account.confirmCredentials(email, password)
  }

  static async sendRecoveryEmail() {
    await waitForLibsInit()
    const host = ColivingBackend._getHostUrl()
    return colivingLibs.Account.generateRecoveryLink({ host })
  }

  static _getHostUrl() {
    return NATIVE_MOBILE && process.env.REACT_APP_ENVIRONMENT === 'production'
      ? COLIVING_ORIGIN
      : window.location.origin
  }

  static async associateColivingUserForAuth(email, handle) {
    await waitForLibsInit()
    try {
      await colivingLibs.Account.associateColivingUserForAuth(email, handle)
      return { success: true }
    } catch (error) {
      console.error(error.message)
      return { success: false, error }
    }
  }

  static async emailInUse(email) {
    await waitForLibsInit()
    try {
      const { exists: emailExists } =
        await colivingLibs.Account.checkIfEmailRegistered(email)
      return emailExists
    } catch (error) {
      console.error(error.message)
      return true
    }
  }

  static async handleInUse(handle) {
    await waitForLibsInit()
    try {
      const handleIsValid = await colivingLibs.Account.handleIsValid(handle)
      return !handleIsValid
    } catch (error) {
      return true
    }
  }

  static async twitterHandle(handle) {
    await waitForLibsInit()
    try {
      const user = await colivingLibs.Account.lookupTwitterHandle(handle)
      return { success: true, user }
    } catch (error) {
      return { success: false, error }
    }
  }

  static async associateTwitterAccount(twitterId, userId, handle) {
    await waitForLibsInit()
    try {
      await colivingLibs.Account.associateTwitterUser(twitterId, userId, handle)
      return { success: true }
    } catch (error) {
      console.error(error.message)
      return { success: false, error }
    }
  }

  static async associateInstagramAccount(instagramId, userId, handle) {
    await waitForLibsInit()
    try {
      await colivingLibs.Account.associateInstagramUser(
        instagramId,
        userId,
        handle
      )
      return { success: true }
    } catch (error) {
      console.error(error.message)
      return { success: false, error }
    }
  }

  static async getNotifications({ limit, timeOffset, withTips }) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      const timeOffsetQuery = timeOffset
        ? `&timeOffset=${encodeURI(timeOffset)}`
        : ''
      const limitQuery = `&limit=${limit}`
      const handleQuery = `&handle=${account.handle}`
      const withTipsQuery = withTips ? `&withTips=true` : ''
      // TODO: withRemix, withTrending, withRewards are always true and should be removed in a future release
      const notifications = await fetch(
        `${IDENTITY_SERVICE}/notifications?${limitQuery}${timeOffsetQuery}${handleQuery}${withTipsQuery}&withRewards=true&withRemix=true&withTrendingAgreement=true`,
        {
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      ).then((res) => {
        if (res.status !== 200) {
          return {
            success: false,
            error: new Error('Invalid Server Response'),
            isRequestError: true
          }
        }
        return res.json()
      })
      return notifications
    } catch (e) {
      console.error(e)
      return { success: false, error: e, isRequestError: true }
    }
  }

  static async markAllNotificationAsViewed() {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/notifications/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ isViewed: true, clearBadges: !!NATIVE_MOBILE })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async clearNotificationBadges() {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/notifications/clear_badges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async getEmailNotificationSettings() {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      const res = await fetch(`${IDENTITY_SERVICE}/notifications/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  static async updateEmailNotificationSettings(emailFrequency) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      const res = await fetch(`${IDENTITY_SERVICE}/notifications/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ settings: { emailFrequency } })
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  static async updateNotificationSettings(settings) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/browser/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ settings })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async updatePushNotificationSettings(settings) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ settings })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async signData() {
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const data = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = await colivingLibs.Account.web3Manager.sign(data)
    return { data, signature }
  }

  static async signDiscoveryNodeRequest(input) {
    await waitForLibsInit()
    let data
    if (input) {
      data = input
    } else {
      const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
      data = `Click sign to authenticate with discovery node: ${unixTs}`
    }
    const signature = await colivingLibs.Account.web3Manager.sign(data)
    return { data, signature }
  }

  static async getBrowserPushNotificationSettings() {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/browser/settings`, {
        headers: {
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      })
        .then((res) => res.json())
        .then((res) => res.settings)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  static async getBrowserPushSubscription(pushEndpoint) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      const endpiont = encodeURIComponent(pushEndpoint)
      return fetch(
        `${IDENTITY_SERVICE}/push_notifications/browser/enabled?endpoint=${endpiont}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.enabled)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  static async getSafariBrowserPushEnabled(deviceToken) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(
        `${IDENTITY_SERVICE}/push_notifications/device_token/enabled?deviceToken=${deviceToken}&deviceType=safari`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.enabled)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  static async updateBrowserNotifications({ enabled = true, subscription }) {
    await waitForLibsInit()
    const { data, signature } = await ColivingBackend.signData()
    return fetch(`${IDENTITY_SERVICE}/push_notifications/browser/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AuthHeaders.Message]: data,
        [AuthHeaders.Signature]: signature
      },
      body: JSON.stringify({ enabled, subscription })
    }).then((res) => res.json())
  }

  static async disableBrowserNotifications({ subscription }) {
    await waitForLibsInit()
    const { data, signature } = await ColivingBackend.signData()
    return fetch(`${IDENTITY_SERVICE}/push_notifications/browser/deregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AuthHeaders.Message]: data,
        [AuthHeaders.Signature]: signature
      },
      body: JSON.stringify({ subscription })
    }).then((res) => res.json())
  }

  static async getPushNotificationSettings() {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/settings`, {
        headers: {
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      })
        .then((res) => res.json())
        .then((res) => res.settings)
    } catch (e) {
      console.error(e)
    }
  }

  static async registerDeviceToken(deviceToken, deviceType) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/device_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({
          deviceToken,
          deviceType
        })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async deregisterDeviceToken(deviceToken) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(
        `${IDENTITY_SERVICE}/push_notifications/device_token/deregister`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({
            deviceToken
          })
        }
      ).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async getUserSubscribed(userId) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(
        `${IDENTITY_SERVICE}/notifications/subscription?userId=${userId}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) =>
          res.users && res.users[userId.toString()]
            ? res.users[userId.toString()].isSubscribed
            : false
        )
    } catch (e) {
      console.error(e)
    }
  }

  static async getUserSubscriptions(userIds) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(
        `${IDENTITY_SERVICE}/notifications/subscription?${userIds
          .map((id) => `userId=${id}`)
          .join('&')}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.users)
    } catch (e) {
      console.error(e)
    }
  }

  static async updateUserSubscription(userId, isSubscribed) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/notifications/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({
          userId,
          isSubscribed
        })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async updateUserLocationTimezone() {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      const timezone = dayjs.tz.guess()
      const res = await fetch(`${IDENTITY_SERVICE}/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ timezone })
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  static async sendWelcomeEmail({ name }) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/email/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ name, isNativeMobile: !!NATIVE_MOBILE })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async updateUserEvent({ hasSignedInNativeMobile }) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await ColivingBackend.signData()
      const res = await fetch(`${IDENTITY_SERVICE}/userEvents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ hasSignedInNativeMobile })
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * Sets the content list as viewed to reset the content list updates notifications timer
   * @param {content listId} content listId content list id or folder id
   */
  static async updatePlaylistLastViewedAt(content listId) {
    if (!getFeatureEnabled(FeatureFlags.CONTENT_LIST_UPDATES_ENABLED)) return

    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return

    try {
      const { data, signature } = await ColivingBackend.signData()
      await fetch(
        `${IDENTITY_SERVICE}/user_content list_updates?walletAddress=${account.wallet}&content listId=${content listId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
    } catch (err) {
      console.error(err.message)
      return false
    }
  }

  static async updateHCaptchaScore(token) {
    await waitForLibsInit()
    const account = colivingLibs.Account.getCurrentUser()
    if (!account) return { error: true }

    try {
      const { data, signature } = await ColivingBackend.signData()
      return await fetch(`${IDENTITY_SERVICE}/score/hcaptcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ token })
      }).then((res) => res.json())
    } catch (err) {
      console.error(err.message)
      return { error: true }
    }
  }

  static async getRandomFeePayer() {
    await waitForLibsInit()
    try {
      const { feePayer } =
        await colivingLibs.solanaWeb3Manager.getRandomFeePayer()
      colivingLibs.solanaWeb3Manager.feePayerKey = new PublicKey(feePayer)
      return { feePayer }
    } catch (err) {
      console.error(err.message)
      return { error: true }
    }
  }

  /**
   * Retrieves the claim distribution amount
   * @returns {BN} amount The claim amount
   */
  static async getClaimDistributionAmount() {
    await waitForLibsInit()
    const wallet = colivingLibs.web3Manager.getWalletAddress()
    if (!wallet) return

    try {
      const amount = await colivingLibs.Account.getClaimDistributionAmount()
      return amount
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Make the claim for the distribution
   * NOTE: if the claim was already made, the response will 500 and error
   * @returns {Promise<boolean>} didMakeClaim
   */
  static async makeDistributionClaim() {
    await waitForLibsInit()
    const wallet = colivingLibs.web3Manager.getWalletAddress()
    if (!wallet) return null

    await colivingLibs.Account.makeDistributionClaim()
  }

  /**
   * Make a request to check if the user has already claimed
   * @returns {Promise<boolean>} doesHaveClaim
   */
  static async getHasClaimed() {
    await waitForLibsInit()
    const wallet = colivingLibs.web3Manager.getWalletAddress()
    if (!wallet) return

    try {
      const hasClaimed = await colivingLibs.Account.getHasClaimed()
      return hasClaimed
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Make a request to fetch the eth LIVE balance of the the user
   * @params {bool} bustCache
   * @returns {Promise<BN>} balance
   */
  static async getBalance(bustCache = false) {
    await waitForLibsInit()
    const wallet = colivingLibs.web3Manager.getWalletAddress()
    if (!wallet) return

    try {
      const ethWeb3 = colivingLibs.ethWeb3Manager.getWeb3()
      const checksumWallet = ethWeb3.utils.toChecksumAddress(wallet)
      if (bustCache) {
        colivingLibs.ethContracts.ColivingTokenClient.bustCache()
      }
      const balance = await colivingLibs.ethContracts.ColivingTokenClient.balanceOf(
        checksumWallet
      )
      return balance
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Make a request to fetch the sol wrapped live balance of the the user
   * @returns {Promise<BN>} balance
   */
  static async getWAudioBalance() {
    await waitForLibsInit()

    try {
      const userBank = await colivingLibs.solanaWeb3Manager.getUserBank()
      const ownerWAudioBalance =
        await colivingLibs.solanaWeb3Manager.getWAudioBalance(userBank)
      if (!ownerWAudioBalance) {
        console.error('Failed to fetch account wlive balance')
        return new BN('0')
      }
      return ownerWAudioBalance
    } catch (e) {
      console.error(e)
      return new BN('0')
    }
  }

  /**
   * Make a request to fetch the balance, staked and delegated total of the wallet address
   * @params {string} address The wallet address to fetch the balance for
   * @params {bool} bustCache
   * @returns {Promise<BN>} balance
   */
  static async getAddressTotalStakedBalance(address, bustCache = false) {
    await waitForLibsInit()
    if (!address) return

    try {
      const ethWeb3 = colivingLibs.ethWeb3Manager.getWeb3()
      const checksumWallet = ethWeb3.utils.toChecksumAddress(address)
      if (bustCache) {
        colivingLibs.ethContracts.ColivingTokenClient.bustCache()
      }
      const balance = await colivingLibs.ethContracts.ColivingTokenClient.balanceOf(
        checksumWallet
      )
      const delegatedBalance =
        await colivingLibs.ethContracts.DelegateManagerClient.getTotalDelegatorStake(
          checksumWallet
        )
      const stakedBalance =
        await colivingLibs.ethContracts.StakingProxyClient.totalStakedFor(
          checksumWallet
        )

      return balance.add(delegatedBalance).add(stakedBalance)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Make a request to send
   */
  static async sendTokens(address, amount) {
    await waitForLibsInit()
    const receipt = await colivingLibs.Account.permitAndSendTokens(
      address,
      amount
    )
    return receipt
  }

  /**
   * Make a request to send solana wrapped live
   */
  static async sendWAudioTokens(address, amount) {
    await waitForLibsInit()

    // Check when sending wlive if the user has a user bank acccount
    let tokenAccountInfo =
      await colivingLibs.solanaWeb3Manager.getAssociatedTokenAccountInfo(address)
    if (!tokenAccountInfo) {
      console.info('Provided recipient solana address was not a token account')
      // If not, check to see if it already has an associated token account.
      const associatedTokenAccount =
        await colivingLibs.solanaWeb3Manager.findAssociatedTokenAddress(address)
      tokenAccountInfo =
        await colivingLibs.solanaWeb3Manager.getAssociatedTokenAccountInfo(
          associatedTokenAccount.toString()
        )

      // If it's not a valid token account, we need to make one first
      if (!tokenAccountInfo) {
        // We do not want to relay gas fees for this token account creation,
        // so we ask the user to create one with phantom, showing an error
        // if phantom is not found.
        if (!window.phantom) {
          return {
            error:
              'Recipient has no $LIVE token account. Please install Phantom-Wallet to create one.'
          }
        }
        if (!window.solana.isConnected) {
          await window.solana.connect()
        }

        const phantomWallet = window.solana.publicKey.toString()
        const tx = await getCreateAssociatedTokenAccountTransaction({
          feePayerKey: SolanaUtils.newPublicKeyNullable(phantomWallet),
          solanaWalletKey: SolanaUtils.newPublicKeyNullable(address),
          mintKey: colivingLibs.solanaWeb3Manager.mintKey,
          solanaTokenProgramKey: colivingLibs.solanaWeb3Manager.solanaTokenKey,
          connection: colivingLibs.solanaWeb3Manager.connection
        })
        const { signature } = await window.solana.signAndSendTransaction(tx)
        await colivingLibs.solanaWeb3Manager.connection.confirmTransaction(
          signature
        )
      }
    }
    return colivingLibs.solanaWeb3Manager.transferWAudio(address, amount)
  }

  static async getSignature(data) {
    await waitForLibsInit()
    return colivingLibs.web3Manager.sign(data)
  }

  /**
   * Get latest transaction receipt based on block number
   * Used by confirmer
   */

  static getLatestTxReceipt(receipts) {
    if (!receipts.length) return {}
    return receipts.sort((receipt1, receipt2) =>
      receipt1.blockNumber < receipt2.blockNumber ? 1 : -1
    )[0]
  }

  /**
   * Transfers the user's ERC20 LIVE into SPL WLIVE to their solana user bank account
   * @param {BN} balance The amount of LIVE to be transferred
   * @returns {
   *   txSignature: string
   *   phase: string
   *   error: error | null
   *   logs: Array<string>
   * }
   */
  static async transferAudioToWAudio(balance) {
    await waitForLibsInit()
    const userBank = await colivingLibs.solanaWeb3Manager.getUserBank()
    return colivingLibs.Account.proxySendTokensFromEthToSol(
      balance,
      userBank.toString()
    )
  }

  /**
   * Fetches the SPL WLIVE balance for the user's solana wallet address
   * @param {string} The solana wallet address
   * @returns {Promise<BN>}
   */
  static async getAddressWAudioBalance(address) {
    await waitForLibsInit()
    const wliveBalance = await colivingLibs.solanaWeb3Manager.getWAudioBalance(
      address
    )
    if (!wliveBalance) {
      console.error(`Failed to get wlive balance for address: ${address}`)
      return new BN('0')
    }
    return wliveBalance
  }

  /**
   * Aggregate, submit, and evaluate attestations for a given challenge for a user
   */
  static async submitAndEvaluateAttestations({
    challenges,
    userId,
    handle,
    recipientEthAddress,
    oracleEthAddress,
    amount,
    quorumSize,
    endpoints,
    AAOEndpoint,
    parallelization,
    feePayerOverride,
    isFinalAttempt
  }) {
    await waitForLibsInit()
    try {
      if (!challenges.length) return

      const reporter = new ClientRewardsReporter(colivingLibs)

      const encodedUserId = encodeHashId(userId)

      const attester = new ColivingLibs.RewardsAttester({
        libs: colivingLibs,
        parallelization,
        quorumSize,
        aaoEndpoint: AAOEndpoint,
        aaoAddress: oracleEthAddress,
        endpoints,
        feePayerOverride,
        reporter
      })

      const res = await attester.processChallenges(
        challenges.map(({ specifier, challenge_id: challengeId }) => ({
          specifier,
          challengeId,
          userId: encodedUserId,
          amount,
          handle,
          wallet: recipientEthAddress
        }))
      )
      if (res.errors) {
        console.error(
          `Got errors in processChallenges: ${JSON.stringify(res.errors)}`
        )
        const hcaptchaOrCognito = res.errors.find(
          ({ error }) =>
            error === FailureReason.HCAPTCHA ||
            error === FailureReason.COGNITO_FLOW
        )

        // If any of the errors are HCAPTCHA or Cognito, return that one
        // Otherwise, just return the first error we saw
        const error = hcaptchaOrCognito
          ? hcaptchaOrCognito.error
          : res.errors[0].error
        return { error }
      }
      return res
    } catch (e) {
      console.log(`Failed in libs call to claim reward`)
      console.error(e)
      return { error: true }
    }
  }
}

/**
 * Finds the associated token address given a solana wallet public key
 * @param {PublicKey} solanaWalletKey Public Key for a given solana account (a wallet)
 * @param {PublicKey} mintKey
 * @param {PublicKey} solanaTokenProgramKey
 * @returns {PublicKey} token account public key
 */
async function findAssociatedTokenAddress({
  solanaWalletKey,
  mintKey,
  solanaTokenProgramKey
}) {
  const addresses = await PublicKey.findProgramAddress(
    [
      solanaWalletKey.toBuffer(),
      solanaTokenProgramKey.toBuffer(),
      mintKey.toBuffer()
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return addresses[0]
}

/**
 * Creates an associated token account for a given solana account (a wallet)
 * @param {PublicKey} feePayerKey
 * @param {PublicKey} solanaWalletKey the wallet we wish to create a token account for
 * @param {PublicKey} mintKey
 * @param {PublicKey} solanaTokenProgramKey
 * @param {Connection} connection
 * @param {IdentityService} identityService
 */
async function getCreateAssociatedTokenAccountTransaction({
  feePayerKey,
  solanaWalletKey,
  mintKey,
  solanaTokenProgramKey,
  connection
}) {
  const associatedTokenAddress = await findAssociatedTokenAddress({
    solanaWalletKey,
    mintKey,
    solanaTokenProgramKey
  })
  console.log({
    SYSVAR_RENT_PUBKEY,
    solanaTokenProgramKey
  })

  console.log({
    SystemProgram
  })
  const accounts = [
    // 0. `[sw]` Funding account (must be a system account)
    {
      pubkey: feePayerKey,
      isSigner: true,
      isWritable: true
    },
    // 1. `[w]` Associated token account address to be created
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true
    },
    // 2. `[r]` Wallet address for the new associated token account
    {
      pubkey: solanaWalletKey,
      isSigner: false,
      isWritable: false
    },
    // 3. `[r]` The token mint for the new associated token account
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: false
    },
    // 4. `[r]` System program
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    },
    // 5. `[r]` SPL Token program
    {
      pubkey: solanaTokenProgramKey,
      isSigner: false,
      isWritable: false
    },
    // 6. `[r]` Rent sysvar
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    }
  ]

  const { blockhash } = await connection.getRecentBlockhash('confirmed')
  const instr = new TransactionInstruction({
    keys: accounts.map((account) => ({
      pubkey: account.pubkey,
      isSigner: account.isSigner,
      isWritable: account.isWritable
    })),
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([])
  })
  const tx = new Transaction({ recentBlockhash: blockhash })
  tx.feePayer = feePayerKey
  tx.add(instr)
  return tx
}

export default ColivingBackend
