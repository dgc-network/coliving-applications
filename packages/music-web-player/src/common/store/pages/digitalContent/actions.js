export const SET_DIGITAL_CONTENT_RANK = 'DIGITAL_CONTENT_PAGE/SET_DIGITAL_CONTENT_RANK'
export const GET_DIGITAL_CONTENT_RANKS = 'DIGITAL_CONTENT_PAGE/GET_DIGITAL_CONTENT_RANKS'
export const RESET = 'DIGITAL_CONTENT_PAGE/RESET'
export const SET_DIGITAL_CONTENT_ID = 'DIGITAL_CONTENT_PAGE/SET_DIGITAL_CONTENT_ID'
export const SET_DIGITAL_CONTENT_PERMALINK = 'DIGITAL_CONTENT_PAGE/SET_DIGITAL_CONTENT_PERMALINK'
export const MAKE_DIGITAL_CONTENT_PUBLIC = 'DIGITAL_CONTENT_PAGE/MAKE_DIGITAL_CONTENT_PUBLIC'
export const SET_DIGITAL_CONTENT_TRENDING_RANKS = 'DIGITAL_CONTENT_PAGE/SET_DIGITAL_CONTENT_TRENDING_RANKS'

export const FETCH_DIGITAL_CONTENT = 'DIGITAL_CONTENT_PAGE/FETCH_DIGITAL_CONTENT'
export const FETCH_DIGITAL_CONTENT_SUCCEEDED = 'DIGITAL_CONTENT_PAGE/FETCH_DIGITAL_CONTENT_SUCCEEDED'
export const FETCH_DIGITAL_CONTENT_FAILED = 'DIGITAL_CONTENT_PAGE/FETCH_DIGITAL_CONTENT_FAILED'

export const GO_TO_REMIXES_OF_PARENT_PAGE =
  'DIGITAL_CONTENT_PAGE/GO_TO_REMIXES_OF_PARENT_PAGE'

export const REFETCH_LINEUP = 'DIGITAL_CONTENT_PAGE/REFETCH_LINEUP'

export const getDigitalContentRanks = (digitalContentId) => ({ type: GET_DIGITAL_CONTENT_RANKS, digitalContentId })
export const setDigitalContentRank = (duration, rank) => ({
  type: SET_DIGITAL_CONTENT_RANK,
  duration,
  rank
})
export const resetDigitalContentPage = (rank) => ({ type: RESET })
export const setDigitalContentId = (digitalContentId) => ({ type: SET_DIGITAL_CONTENT_ID, digitalContentId })
export const setDigitalContentPermalink = (permalink) => ({
  type: SET_DIGITAL_CONTENT_PERMALINK,
  permalink
})
export const makeDigitalContentPublic = (digitalContentId) => ({
  type: MAKE_DIGITAL_CONTENT_PUBLIC,
  digitalContentId
})

export const fetchDigitalContent = (digitalContentId, slug, handle, canBeUnlisted) => ({
  type: FETCH_DIGITAL_CONTENT,
  digitalContentId,
  slug,
  handle,
  canBeUnlisted
})
export const fetchDigitalContentSucceeded = (digitalContentId) => ({
  type: FETCH_DIGITAL_CONTENT_SUCCEEDED,
  digitalContentId
})
export const fetchDigitalContentFailed = (digitalContentId) => ({ type: FETCH_DIGITAL_CONTENT_FAILED })

export const goToRemixesOfParentPage = (parentDigitalContentId) => ({
  type: GO_TO_REMIXES_OF_PARENT_PAGE,
  parentDigitalContentId
})

/**
 * Refreshes the lineup based on the digital_content that's currently set.
 * Useful when the lineup's content depends on changes that may
 * happen to the digital_content in view on the digital_content page.
 */
export const refetchLineup = () => ({
  type: REFETCH_LINEUP
})

export const setDigitalContentTrendingRanks = (trendingDigitalContentRanks) => ({
  type: SET_DIGITAL_CONTENT_TRENDING_RANKS,
  trendingDigitalContentRanks
})
