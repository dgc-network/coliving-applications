import {
  ID,
  TimeRange,
  StemAgreementMetadata,
  Nullable,
  removeNullable,
  IntKeys,
  StringKeys
} from '@coliving/common'

import { SearchKind } from 'common/store/pages/searchResults/types'
import ColivingBackend, { AuthHeaders } from 'services/colivingBackend'
import { SupporterResponse } from 'services/colivingBackend/tipping'
import {
  getEagerDiscprov,
  waitForLibsInit
} from 'services/colivingBackend/eagerLoadUtils'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'
import { decodeHashId, encodeHashId } from 'utils/route/hashIds'

import * as adapter from './responseAdapter'
import { processSearchResults } from './helper'
import {
  APIActivity,
  APIBlockConfirmation,
  APIContentList,
  APIResponse,
  APISearch,
  APISearchAutocomplete,
  APIStem,
  APIAgreement,
  APIUser,
  OpaqueID
} from './types'

declare global {
  interface Window {
    colivingLibs: any
  }
}

enum PathType {
  RootPath = '',
  VersionPath = '/v1',
  VersionFullPath = '/v1/full'
}

const ROOT_ENDPOINT_MAP = {
  feed: `/feed`,
  healthCheck: '/health_check',
  blockConfirmation: '/block_confirmation'
}

const FULL_ENDPOINT_MAP = {
  trending: (experiment: string | null) =>
    experiment ? `/agreements/trending/${experiment}` : '/agreements/trending',
  trendingIds: (experiment: string | null) =>
    experiment ? `/agreements/trending/ids/${experiment}` : '/agreements/trending/ids',
  trendingUnderground: (experiment: string | null) =>
    experiment
      ? `/agreements/trending/underground/${experiment}`
      : '/agreements/trending/underground',
  trendingContentLists: (experiment: string | null) =>
    experiment ? `/contentLists/trending/${experiment}` : '/contentLists/trending',
  recommended: '/agreements/recommended',
  remixables: '/agreements/remixables',
  following: (userId: OpaqueID) => `/users/${userId}/following`,
  followers: (userId: OpaqueID) => `/users/${userId}/followers`,
  agreementRepostUsers: (agreementId: OpaqueID) => `/agreements/${agreementId}/reposts`,
  agreementFavoriteUsers: (agreementId: OpaqueID) => `/agreements/${agreementId}/favorites`,
  contentListRepostUsers: (contentListId: OpaqueID) =>
    `/contentLists/${contentListId}/reposts`,
  contentListFavoriteUsers: (contentListId: OpaqueID) =>
    `/contentLists/${contentListId}/favorites`,
  getUser: (userId: OpaqueID) => `/users/${userId}`,
  userByHandle: (handle: OpaqueID) => `/users/handle/${handle}`,
  userAgreementsByHandle: (handle: OpaqueID) => `/users/handle/${handle}/agreements`,
  userFavoritedAgreements: (userId: OpaqueID) =>
    `/users/${userId}/favorites/agreements`,
  userRepostsByHandle: (handle: OpaqueID) => `/users/handle/${handle}/reposts`,
  getRelatedLandlords: (userId: OpaqueID) => `/users/${userId}/related`,
  getContentList: (contentListId: OpaqueID) => `/contentLists/${contentListId}`,
  topGenreUsers: '/users/genre/top',
  topLandlords: '/users/top',
  getAgreement: (agreementId: OpaqueID) => `/agreements/${agreementId}`,
  getAgreementByHandleAndSlug: `/agreements`,
  getStems: (agreementId: OpaqueID) => `/agreements/${agreementId}/stems`,
  getRemixes: (agreementId: OpaqueID) => `/agreements/${agreementId}/remixes`,
  getRemixing: (agreementId: OpaqueID) => `/agreements/${agreementId}/remixing`,
  searchFull: `/search/full`,
  searchAutocomplete: `/search/autocomplete`,
  getUserAgreementHistory: (userId: OpaqueID) => `/users/${userId}/history/agreements`,
  getUserSupporter: (userId: OpaqueID, supporterUserId: OpaqueID) =>
    `/users/${userId}/supporters/${supporterUserId}`,
  getUserSupporting: (userId: OpaqueID, supporterUserId: OpaqueID) =>
    `/users/${userId}/supporting/${supporterUserId}`,
  getReaction: '/reactions'
}

const ENDPOINT_MAP = {
  associatedWallets: '/users/associated_wallets',
  associatedWalletUserId: '/users/id',
  userChallenges: (userId: OpaqueID) => `/users/${userId}/challenges`,
  undisbursedUserChallenges: `/challenges/undisbursed`
}

const TRENDING_LIMIT = 100

type QueryParams = {
  [key: string]: string | number | undefined | boolean | string[] | null
}

export type GetAgreementArgs = {
  id: ID
  currentUserId?: Nullable<ID>
  unlistedArgs?: {
    urlTitle: string
    handle: string
  }
}

type GetAgreementByHandleAndSlugArgs = {
  handle: string
  slug: string
  currentUserId: Nullable<ID>
}

type PaginationArgs = {
  limit?: number
  offset?: number
}

type CurrentUserIdArg = { currentUserId: Nullable<ID> }

type GetTopLandlordsArgs = PaginationArgs & CurrentUserIdArg

type GetTrendingArgs = {
  timeRange?: TimeRange
  offset?: number
  limit?: number
  currentUserId: Nullable<ID>
  genre: Nullable<string>
}

type GetTrendingUndergroundArgs = {
  offset?: number
  limit?: number
  currentUserId: Nullable<ID>
}

type GetTrendingIdsArgs = {
  limit?: number
  genre?: Nullable<string>
}

type GetRecommendedArgs = {
  genre: Nullable<string>
  exclusionList: number[]
  currentUserId: Nullable<ID>
}

type GetRemixablesArgs = {
  limit?: number
  currentUserId: Nullable<ID>
}

type GetFollowingArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetFollowersArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetAgreementRepostUsersArgs = {
  agreementId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetAgreementFavoriteUsersArgs = {
  agreementId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetContentListRepostUsersArgs = {
  contentListId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetContentListFavoriteUsersArgs = {
  contentListId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetUserArgs = {
  userId: ID
  currentUserId: Nullable<ID>
}

type GetUserByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
}

type GetUserAgreementsByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
  getUnlisted: boolean
}

type GetRelatedLandlordsArgs = CurrentUserIdArg &
  PaginationArgs & {
    userId: ID
  }

type GetProfileListArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetTopLandlordGenresArgs = {
  genres?: string[]
  limit?: number
  offset?: number
}

type GetUserRepostsByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetContentListArgs = {
  contentListId: ID
  currentUserId: Nullable<ID>
}

type GetStemsArgs = {
  agreementId: ID
}

type GetRemixesArgs = {
  agreementId: ID
  currentUserId: Nullable<ID>
  limit: number
  offset: number
}

type RemixesResponse = {
  agreements: APIAgreement[]
  count: number
}

type GetRemixingArgs = {
  agreementId: ID
  currentUserId: Nullable<ID>
  limit: number
  offset: number
}

type GetSearchArgs = {
  currentUserId: ID
  query: string
  kind: SearchKind
  limit?: number
  offset?: number
}

type TrendingIdsResponse = {
  week: { id: string }[]
  month: { id: string }[]
  allTime: { id: string }[]
}

type TrendingIds = {
  week: ID[]
  month: ID[]
  allTime: ID[]
}

type GetTrendingContentListsArgs = {
  currentUserId: Nullable<ID>
  limit: number
  offset: number
  time: 'week' | 'month' | 'year'
}

type GetAssociatedWalletsArgs = {
  userID: number
}

export type AssociatedWalletsResponse = {
  wallets: string[]
  sol_wallets: string[]
}

type GetAssociatedWalletUserIDArgs = {
  address: string
}

type AssociatedWalletUserIdResponse = {
  user_id: Nullable<ID>
}

type GetUserChallengesArgs = {
  userID: number
}

type UserChallengesResponse = [
  {
    challenge_id: string
    user_id: string
    specifier: string
    is_complete: boolean
    is_active: boolean
    is_disbursed: boolean
    current_step_count: number
    max_steps: number
    challenge_type: string
    amount: string
    metadata: object
  }
]

type UndisbursedUserChallengesResponse = [
  {
    challenge_id: string
    user_id: string
    specifier: string
    amount: string
    completed_blocknumber: number
    handle: string
    wallet: string
  }
]

export type GetSocialFeedArgs = QueryParams & {
  filter: string
  with_users?: boolean
  agreements_only?: boolean
  followee_user_ids?: ID[]
  current_user_id?: ID
}

type GetSocialFeedResponse = {}

type GetUserAgreementHistoryArgs = {
  userId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetReactionArgs = {
  reactedToIds: string[]
}

type GetReactionResponse = [
  {
    reaction_value: string
    reaction_type: string
    sender_user_id: string
    reacted_to: string
  }
]

type InitializationState =
  | { state: 'uninitialized' }
  | {
      state: 'initialized'
      endpoint: string
      // Requests are dispatched via APIClient rather than libs
      type: 'manual'
    }
  | {
      state: 'initialized'
      endpoint: string
      // Requests are dispatched and handled via libs
      type: 'libs'
    }

const emptySearchResponse: APIResponse<APISearch> = {
  data: {
    users: [],
    followed_users: [],
    agreements: [],
    saved_agreements: [],
    contentLists: [],
    saved_content_lists: [],
    saved_albums: [],
    albums: []
  }
}

type GetUserSupporterArgs = {
  userId: ID
  supporterUserId: ID
  currentUserId: Nullable<ID>
}

class ColivingAPIClient {
  initializationState: InitializationState = {
    state: 'uninitialized'
  }

  overrideEndpoint?: string

  constructor({ overrideEndpoint }: { overrideEndpoint?: string } = {}) {
    this.overrideEndpoint = overrideEndpoint
  }

  async getTrending({
    timeRange = TimeRange.WEEK,
    limit = TRENDING_LIMIT,
    offset = 0,
    currentUserId,
    genre
  }: GetTrendingArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      time: timeRange,
      limit,
      offset,
      user_id: encodedCurrentUserId || undefined,
      genre: genre || undefined
    }
    const experiment = remoteConfigInstance.getRemoteVar(
      StringKeys.TRENDING_EXPERIMENT
    )
    const trendingResponse: Nullable<APIResponse<APIAgreement[]>> =
      await this._getResponse(FULL_ENDPOINT_MAP.trending(experiment), params)

    if (!trendingResponse) return []

    const adapted = trendingResponse.data
      .map(adapter.makeAgreement)
      .filter(removeNullable)
    return adapted
  }

  async getTrendingUnderground({
    limit = TRENDING_LIMIT,
    offset = 0,
    currentUserId
  }: GetTrendingUndergroundArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      limit,
      offset,
      user_id: encodedCurrentUserId
    }
    const experiment = remoteConfigInstance.getRemoteVar(
      StringKeys.UNDERGROUND_TRENDING_EXPERIMENT
    )
    const trendingResponse: Nullable<APIResponse<APIAgreement[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.trendingUnderground(experiment),
        params
      )

    if (!trendingResponse) return []

    const adapted = trendingResponse.data
      .map(adapter.makeAgreement)
      .filter(removeNullable)
    return adapted
  }

  async getTrendingIds({ genre, limit }: GetTrendingIdsArgs) {
    this._assertInitialized()
    const params = {
      limit,
      genre: genre || undefined
    }
    const experiment = remoteConfigInstance.getRemoteVar(
      StringKeys.TRENDING_EXPERIMENT
    )
    const trendingIdsResponse: Nullable<APIResponse<TrendingIdsResponse>> =
      await this._getResponse(FULL_ENDPOINT_MAP.trendingIds(experiment), params)
    if (!trendingIdsResponse) {
      return {
        week: [],
        month: [],
        allTime: []
      }
    }

    const timeRanges = Object.keys(trendingIdsResponse.data) as TimeRange[]
    const res = timeRanges.reduce(
      (acc: TrendingIds, timeRange: TimeRange) => {
        acc[timeRange] = trendingIdsResponse.data[timeRange]
          .map(adapter.makeAgreementId)
          .filter(Boolean) as ID[]
        return acc
      },
      {
        week: [],
        month: [],
        allTime: []
      }
    )
    return res
  }

  async getRecommended({
    genre,
    exclusionList,
    currentUserId
  }: GetRecommendedArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      genre,
      limit: remoteConfigInstance.getRemoteVar(IntKeys.AUTOPLAY_LIMIT) || 10,
      exclusion_list:
        exclusionList.length > 0 ? exclusionList.map(String) : undefined,
      user_id: encodedCurrentUserId || undefined
    }
    const recommendedResponse: Nullable<APIResponse<APIAgreement[]>> =
      await this._getResponse(FULL_ENDPOINT_MAP.recommended, params)

    if (!recommendedResponse) return []

    const adapted = recommendedResponse.data
      .map(adapter.makeAgreement)
      .filter(removeNullable)
    return adapted
  }

  async getRemixables({ limit = 25, currentUserId }: GetRemixablesArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      limit,
      user_id: encodedCurrentUserId || undefined,
      with_users: true
    }
    const remixablesResponse: Nullable<APIResponse<APIAgreement[]>> =
      await this._getResponse(FULL_ENDPOINT_MAP.remixables, params)

    if (!remixablesResponse) return []

    const adapted = remixablesResponse.data
      .map(adapter.makeAgreement)
      .filter(removeNullable)

    return adapted
  }

  async getFollowing({
    currentUserId,
    profileUserId,
    limit,
    offset
  }: GetFollowingArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const followingResponse: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.following(encodedProfileUserId),
        params
      )
    if (!followingResponse) return []
    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getFollowers({
    currentUserId,
    profileUserId,
    limit,
    offset
  }: GetFollowersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const followersResponse: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.followers(encodedProfileUserId),
        params
      )

    if (!followersResponse) return []

    const adapted = followersResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getAgreementRepostUsers({
    currentUserId,
    agreementId,
    limit,
    offset
  }: GetAgreementRepostUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedAgreementId = this._encodeOrThrow(agreementId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const repostUsers: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.agreementRepostUsers(encodedAgreementId),
        params
      )

    if (!repostUsers) return []

    const adapted = repostUsers.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getAgreementFavoriteUsers({
    currentUserId,
    agreementId,
    limit,
    offset
  }: GetAgreementFavoriteUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedAgreementId = this._encodeOrThrow(agreementId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const followingResponse: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.agreementFavoriteUsers(encodedAgreementId),
        params
      )

    if (!followingResponse) return []

    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getContentListRepostUsers({
    currentUserId,
    contentListId,
    limit,
    offset
  }: GetContentListRepostUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedContentListId = this._encodeOrThrow(contentListId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const repostUsers: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.contentListRepostUsers(encodedContentListId),
        params
      )

    if (!repostUsers) return []

    const adapted = repostUsers.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getContentListFavoriteUsers({
    currentUserId,
    contentListId,
    limit,
    offset
  }: GetContentListFavoriteUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedContentListId = this._encodeOrThrow(contentListId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const followingResponse: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.contentListFavoriteUsers(encodedContentListId),
        params
      )

    if (!followingResponse) return []

    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getAgreement(
    { id, currentUserId, unlistedArgs }: GetAgreementArgs,
    retry = true
  ) {
    const encodedAgreementId = this._encodeOrThrow(id)
    const encodedCurrentUserId = encodeHashId(currentUserId)

    this._assertInitialized()

    const args = {
      user_id: encodedCurrentUserId,
      url_title: unlistedArgs?.urlTitle,
      handle: unlistedArgs?.handle,
      show_unlisted: !!unlistedArgs
    }

    const agreementResponse: Nullable<APIResponse<APIAgreement>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.getAgreement(encodedAgreementId),
        args,
        retry
      )

    if (!agreementResponse) return null
    const adapted = adapter.makeAgreement(agreementResponse.data)
    return adapted
  }

  async getAgreementByHandleAndSlug({
    handle,
    slug,
    currentUserId
  }: GetAgreementByHandleAndSlugArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      handle,
      slug,
      user_id: encodedCurrentUserId || undefined
    }

    const agreementResponse: Nullable<APIResponse<APIAgreement>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.getAgreementByHandleAndSlug,
        params,
        true
      )
    if (!agreementResponse) {
      return null
    }
    return adapter.makeAgreement(agreementResponse.data)
  }

  async getStems({ agreementId }: GetStemsArgs): Promise<StemAgreementMetadata[]> {
    this._assertInitialized()
    const encodedAgreementId = this._encodeOrThrow(agreementId)
    const response: Nullable<APIResponse<APIStem[]>> = await this._getResponse(
      FULL_ENDPOINT_MAP.getStems(encodedAgreementId)
    )

    if (!response) return []

    const adapted = response.data
      .map(adapter.makeStemAgreement)
      .filter(removeNullable)
    return adapted
  }

  async getRemixes({ agreementId, limit, offset, currentUserId }: GetRemixesArgs) {
    this._assertInitialized()
    const encodedAgreementId = this._encodeOrThrow(agreementId)
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      userId: encodedUserId ?? undefined,
      limit,
      offset
    }

    const remixesResponse: Nullable<APIResponse<RemixesResponse>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.getRemixes(encodedAgreementId),
        params
      )

    if (!remixesResponse) return { count: 0, agreements: [] }

    const agreements = remixesResponse.data.agreements
      .map(adapter.makeAgreement)
      .filter(removeNullable)
    return { count: remixesResponse.data.count, agreements }
  }

  async getRemixing({
    agreementId,
    limit,
    offset,
    currentUserId
  }: GetRemixingArgs) {
    this._assertInitialized()
    const encodedAgreementId = this._encodeOrThrow(agreementId)
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      userId: encodedUserId ?? undefined,
      limit,
      offset
    }

    const remixingResponse: Nullable<APIResponse<APIAgreement[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.getRemixing(encodedAgreementId),
        params
      )

    if (!remixingResponse) return []

    const agreements = remixingResponse.data.map(adapter.makeAgreement)
    return agreements
  }

  async getUser({ userId, currentUserId }: GetUserArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response: Nullable<APIResponse<APIUser[]>> = await this._getResponse(
      FULL_ENDPOINT_MAP.getUser(encodedUserId),
      params
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeUser).filter(removeNullable)
    return adapted
  }

  async getUserByHandle({ handle, currentUserId }: GetUserByHandleArgs) {
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response: Nullable<APIResponse<APIUser[]>> = await this._getResponse(
      FULL_ENDPOINT_MAP.userByHandle(handle),
      params
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeUser).filter(removeNullable)
    return adapted
  }

  async getUserAgreementsByHandle({
    handle,
    currentUserId,
    sort = 'date',
    limit,
    offset,
    getUnlisted
  }: GetUserAgreementsByHandleArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      sort,
      limit,
      offset
    }

    let headers = {}
    if (encodedCurrentUserId && getUnlisted) {
      const { data, signature } = await ColivingBackend.signDiscoveryNodeRequest()
      headers = {
        [AuthHeaders.Message]: data,
        [AuthHeaders.Signature]: signature
      }
    }

    const response: Nullable<APIResponse<APIAgreement[]>> = await this._getResponse(
      FULL_ENDPOINT_MAP.userAgreementsByHandle(handle),
      params,
      true,
      PathType.VersionFullPath,
      headers
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeAgreement).filter(removeNullable)
    return adapted
  }

  async getFavoritedAgreements({
    profileUserId,
    currentUserId,
    limit,
    offset
  }: GetProfileListArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedUserId || undefined,
      limit,
      offset
    }

    const response: Nullable<APIResponse<APIActivity[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.userFavoritedAgreements(encodedProfileUserId),
        params
      )

    if (!response) return []

    const adapted = response.data.map(({ item, ...props }) => ({
      timestamp: props.timestamp,
      agreement: adapter.makeAgreement(item as APIAgreement)
    }))
    return adapted
  }

  async getUserRepostsByHandle({
    handle,
    currentUserId,
    limit,
    offset
  }: GetUserRepostsByHandleArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const response: Nullable<APIResponse<APIActivity[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.userRepostsByHandle(handle),
        params
      )

    if (!response) return []

    const adapted = response.data
      .map(adapter.makeActivity)
      .filter(removeNullable)
    return adapted
  }

  async getRelatedLandlords({
    userId,
    currentUserId,
    offset,
    limit
  }: GetRelatedLandlordsArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedUserId = this._encodeOrThrow(userId)
    const response: Nullable<APIResponse<APIUser[]>> = await this._getResponse(
      FULL_ENDPOINT_MAP.getRelatedLandlords(encodedUserId),
      { user_id: encodedCurrentUserId || undefined, offset, limit }
    )
    if (!response) return []
    const adapted = response.data.map(adapter.makeUser).filter(removeNullable)
    return adapted
  }

  async getTopLandlordGenres({ genres, limit, offset }: GetTopLandlordGenresArgs) {
    this._assertInitialized()

    const params = {
      genre: genres,
      limit,
      offset
    }

    const favoritedAgreementResponse: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(FULL_ENDPOINT_MAP.topGenreUsers, params)

    if (!favoritedAgreementResponse) return []

    const adapted = favoritedAgreementResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getTopLandlords({ limit, offset, currentUserId }: GetTopLandlordsArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)

    const params = {
      limit,
      offset,
      user_id: encodedUserId
    }

    const topLandlordsResponse: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(FULL_ENDPOINT_MAP.topLandlords, params)

    if (!topLandlordsResponse) return []

    const adapted = topLandlordsResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getContentList({ contentListId, currentUserId }: GetContentListArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedContentListId = this._encodeOrThrow(contentListId)
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response: Nullable<APIResponse<APIContentList[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.getContentList(encodedContentListId),
        params
      )

    if (!response) return []

    const adapted = response.data
      .map(adapter.makeContentList)
      .filter(removeNullable)
    return adapted
  }

  async getSearchFull({
    currentUserId,
    query,
    kind,
    offset,
    limit
  }: GetSearchArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      query,
      kind,
      offset,
      limit
    }

    const searchResponse: Nullable<APIResponse<APISearch>> =
      (await this._getResponse(FULL_ENDPOINT_MAP.searchFull, params)) ??
      emptySearchResponse

    const adapted = adapter.adaptSearchResponse(searchResponse)
    return processSearchResults(adapted)
  }

  async getSearchAutocomplete({
    currentUserId,
    query,
    kind,
    offset,
    limit
  }: GetSearchArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      query,
      kind,
      offset,
      limit
    }

    const searchResponse: Nullable<APIResponse<APISearchAutocomplete>> =
      (await this._getResponse(FULL_ENDPOINT_MAP.searchAutocomplete, params)) ??
      emptySearchResponse
    const adapted = adapter.adaptSearchAutocompleteResponse(searchResponse)
    return processSearchResults({
      isAutocomplete: true,
      ...adapted
    })
  }

  async getTrendingContentLists({
    currentUserId,
    time,
    limit,
    offset
  }: GetTrendingContentListsArgs) {
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      limit,
      offset,
      time
    }

    const experiment = remoteConfigInstance.getRemoteVar(
      StringKeys.CONTENT_LIST_TRENDING_EXPERIMENT
    )
    const response: Nullable<APIResponse<APIContentList[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.trendingContentLists(experiment),
        params
      )

    if (!response) return []
    const adapted = response.data
      .map(adapter.makeContentList)
      .filter(removeNullable)
    return adapted
  }

  async getAssociatedWallets({ userID }: GetAssociatedWalletsArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(userID)
    const params = { id: encodedCurrentUserId }
    const associatedWallets: Nullable<APIResponse<AssociatedWalletsResponse>> =
      await this._getResponse(
        ENDPOINT_MAP.associatedWallets,
        params,
        true,
        PathType.VersionPath
      )

    if (!associatedWallets) return null
    return associatedWallets.data
  }

  async getAssociatedWalletUserId({ address }: GetAssociatedWalletUserIDArgs) {
    this._assertInitialized()
    const params = { associated_wallet: address }

    const userID: Nullable<APIResponse<AssociatedWalletUserIdResponse>> =
      await this._getResponse(
        ENDPOINT_MAP.associatedWalletUserId,
        params,
        true,
        PathType.VersionPath
      )

    if (!userID) return null
    const encodedUserId = userID.data.user_id
    return encodedUserId ? decodeHashId(encodedUserId.toString()) : null
  }

  getUserChallenges = async ({ userID }: GetUserChallengesArgs) => {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(userID)
    if (encodedCurrentUserId === null) return null // throw error

    const params = { id: encodedCurrentUserId }

    const userChallenges: Nullable<APIResponse<UserChallengesResponse>> =
      await this._getResponse(
        ENDPOINT_MAP.userChallenges(encodedCurrentUserId),
        params,
        true,
        PathType.VersionPath
      )

    if (!userChallenges) return null
    // DN may have amount as a string
    const challenges = userChallenges.data.map((challenge) => {
      return {
        ...challenge,
        amount: Number(challenge.amount)
      }
    })
    return challenges
  }

  getUndisbursedUserChallenges = async ({ userID }: { userID: ID }) => {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(userID)
    if (encodedCurrentUserId === null) return null // throw error

    const params = { user_id: encodedCurrentUserId }

    const undisbursedUserChallenges: Nullable<
      APIResponse<UndisbursedUserChallengesResponse>
    > = await this._getResponse(
      ENDPOINT_MAP.undisbursedUserChallenges,
      params,
      true /* retry */,
      PathType.VersionPath
    )

    if (!undisbursedUserChallenges) return null
    // DN may have amount as a string
    const challenges = undisbursedUserChallenges.data.map((challenge) => {
      return {
        ...challenge,
        amount: Number(challenge.amount)
      }
    })
    return challenges
  }

  async getBlockConfirmation(
    blockhash: string,
    blocknumber: number
  ): Promise<
    | {
        block_found: boolean
        block_passed: boolean
      }
    | {}
  > {
    const response: Nullable<APIResponse<APIBlockConfirmation>> =
      await this._getResponse(
        ROOT_ENDPOINT_MAP.blockConfirmation,
        { blockhash, blocknumber },
        true,
        PathType.RootPath
      )
    if (!response) return {}
    return response.data
  }

  async getSocialFeed({
    offset,
    limit,
    with_users,
    filter,
    agreements_only,
    followee_user_ids,
    current_user_id
  }: GetSocialFeedArgs) {
    this._assertInitialized()
    const headers = current_user_id
      ? {
          'X-User-ID': current_user_id.toString()
        }
      : undefined
    const response: Nullable<APIResponse<GetSocialFeedResponse>> =
      await this._getResponse(
        ROOT_ENDPOINT_MAP.feed,
        {
          offset,
          limit,
          with_users,
          filter,
          agreements_only,
          followee_user_id: followee_user_ids
            ? followee_user_ids.map((id) => id.toString())
            : undefined
        },
        true,
        PathType.RootPath,
        headers
      )
    if (!response) return []
    return response.data
  }

  async getUserAgreementHistory({
    currentUserId,
    userId,
    offset,
    limit
  }: GetUserAgreementHistoryArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    const encodedCurrentUserId = encodeHashId(currentUserId)
    limit = limit || 100
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response: Nullable<APIResponse<APIActivity[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.getUserAgreementHistory(encodedUserId),
        params
      )

    if (!response) return []

    const adapted = response.data.map(({ item, ...props }) => ({
      timestamp: props.timestamp,
      agreement: adapter.makeAgreement(item as APIAgreement)
    }))
    return adapted
  }

  async getUserSupporter({
    currentUserId,
    userId,
    supporterUserId
  }: GetUserSupporterArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    const encodedSupporterUserId = this._encodeOrThrow(supporterUserId)
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response: Nullable<APIResponse<SupporterResponse>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.getUserSupporter(
          encodedUserId,
          encodedSupporterUserId
        ),
        params
      )
    return response ? response.data : null
  }

  async getReaction({ reactedToIds }: GetReactionArgs) {
    const params = {
      reacted_to_ids: reactedToIds
    }
    const response: Nullable<APIResponse<GetReactionResponse>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.getReaction,
        params,
        false,
        PathType.VersionFullPath,
        {},
        true
      ) // Perform without retries, using 'split' approach for multiple query params

    if (!response || !response.data.length) return null

    const adapted = response.data.map((item) => ({
      reactionValue: parseInt(item.reaction_value),
      reactionType: item.reaction_type,
      senderUserId: decodeHashId(item.sender_user_id),
      reactedTo: item.reacted_to
    }))[0]

    return adapted
  }

  init() {
    if (this.initializationState.state === 'initialized') return

    // If override passed, use that and return
    if (this.overrideEndpoint) {
      console.debug(
        `APIClient: Using override endpoint: ${this.overrideEndpoint}`
      )
      this.initializationState = {
        state: 'initialized',
        endpoint: this.overrideEndpoint,
        type: 'manual'
      }
      return
    }

    // Set the state to the eager discprov
    const eagerDiscprov = getEagerDiscprov()
    if (eagerDiscprov) {
      console.debug(`APIClient: setting to eager discprov: ${eagerDiscprov}`)
      this.initializationState = {
        state: 'initialized',
        endpoint: eagerDiscprov,
        type: 'manual'
      }
    }

    // Listen for libs on chain selection
    ColivingBackend.addDiscoveryNodeSelectionListener((endpoint: string) => {
      console.debug(`APIClient: Setting to libs discprov: ${endpoint}`)
      this.initializationState = {
        state: 'initialized',
        endpoint,
        type: 'libs'
      }
    })

    console.debug('APIClient: Initialized')
  }

  makeUrl = (
    path: string,
    queryParams: QueryParams = {},
    pathType: PathType = PathType.VersionPath
  ) => {
    const formattedPath = this._formatPath(pathType, path)
    return this._constructUrl(formattedPath, queryParams)
  }

  // Helpers

  _assertInitialized() {
    if (this.initializationState.state !== 'initialized')
      throw new Error('ColivingAPIClient must be initialized before use')
  }

  async _getResponse<T>(
    path: string,
    params: QueryParams = {},
    retry = true,
    pathType: PathType = PathType.VersionFullPath,
    headers?: { [key: string]: string },
    splitArrayParams = false
  ): Promise<Nullable<T>> {
    if (this.initializationState.state !== 'initialized')
      throw new Error('_constructURL called uninitialized')

    // If a param has a null value, remove it
    const sanitizedParams = Object.keys(params).reduce((acc, cur) => {
      const val = params[cur]
      if (val === null || val === undefined) return acc
      return { ...acc, [cur]: val }
    }, {})

    const formattedPath = this._formatPath(pathType, path)
    if (this.initializationState.type === 'libs' && window.colivingLibs) {
      const data = await window.colivingLibs.discoveryNode._makeRequest(
        {
          endpoint: formattedPath,
          queryParams: sanitizedParams,
          headers
        },
        retry
      )
      if (!data) return null
      // TODO: Type boundaries of API
      return { data } as any
    }

    // Initialization type is manual. Make requests with fetch and handle failures.
    const resource = this._constructUrl(
      formattedPath,
      sanitizedParams,
      splitArrayParams
    )
    try {
      const response = await fetch(resource, { headers })
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      return response.json()
    } catch (e) {
      // Something went wrong with the request and we should wait for the libs
      // initialization state if needed before retrying
      if (this.initializationState.type === 'manual') {
        await waitForLibsInit()
      }
      return this._getResponse(path, sanitizedParams, retry, pathType)
    }
  }

  _formatPath(pathType: PathType, path: string) {
    return `${pathType}${path}`
  }

  _encodeOrThrow(id: ID): OpaqueID {
    const encoded = encodeHashId(id)
    if (!encoded) {
      throw new Error(`Unable to encode id: ${id}`)
    }
    return encoded
  }

  _constructUrl(
    path: string,
    queryParams: QueryParams = {},
    splitArrayParams = false
  ) {
    if (this.initializationState.state !== 'initialized')
      throw new Error('_constructURL called uninitialized')
    const params = Object.entries(queryParams)
      .filter((p) => p[1] !== undefined && p[1] !== null)
      .map((p) => {
        if (Array.isArray(p[1])) {
          if (splitArrayParams) {
            // If we split, join in the form of
            // ?key=val1,val2,val3...
            return `${p[0]}=${[1]
              .map((val) => encodeURIComponent(val))
              .join(',')}`
          } else {
            // Otherwise, join in the form of
            // ?key=val1&key=val2&key=val3...
            return p[1]
              .map((val) => `${p[0]}=${encodeURIComponent(val)}`)
              .join('&')
          }
        }
        return `${p[0]}=${encodeURIComponent(p[1]!)}`
      })
      .join('&')
    return `${this.initializationState.endpoint}${path}?${params}`
  }
}

const instance = new ColivingAPIClient()

export default instance
