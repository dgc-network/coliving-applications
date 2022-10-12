export const SET_AGREEMENT_RANK = 'AGREEMENT_PAGE/SET_AGREEMENT_RANK'
export const GET_AGREEMENT_RANKS = 'AGREEMENT_PAGE/GET_AGREEMENT_RANKS'
export const RESET = 'AGREEMENT_PAGE/RESET'
export const SET_AGREEMENT_ID = 'AGREEMENT_PAGE/SET_AGREEMENT_ID'
export const SET_AGREEMENT_PERMALINK = 'AGREEMENT_PAGE/SET_AGREEMENT_PERMALINK'
export const MAKE_AGREEMENT_PUBLIC = 'AGREEMENT_PAGE/MAKE_AGREEMENT_PUBLIC'
export const SET_AGREEMENT_TRENDING_RANKS = 'AGREEMENT_PAGE/SET_AGREEMENT_TRENDING_RANKS'

export const FETCH_AGREEMENT = 'AGREEMENT_PAGE/FETCH_AGREEMENT'
export const FETCH_AGREEMENT_SUCCEEDED = 'AGREEMENT_PAGE/FETCH_AGREEMENT_SUCCEEDED'
export const FETCH_AGREEMENT_FAILED = 'AGREEMENT_PAGE/FETCH_AGREEMENT_FAILED'

export const GO_TO_REMIXES_OF_PARENT_PAGE =
  'AGREEMENT_PAGE/GO_TO_REMIXES_OF_PARENT_PAGE'

export const REFETCH_LINEUP = 'AGREEMENT_PAGE/REFETCH_LINEUP'

export const getDigitalContentRanks = (digitalContentId) => ({ type: GET_AGREEMENT_RANKS, digitalContentId })
export const setDigitalContentRank = (duration, rank) => ({
  type: SET_AGREEMENT_RANK,
  duration,
  rank
})
export const resetDigitalContentPage = (rank) => ({ type: RESET })
export const setDigitalContentId = (digitalContentId) => ({ type: SET_AGREEMENT_ID, digitalContentId })
export const setDigitalContentPermalink = (permalink) => ({
  type: SET_AGREEMENT_PERMALINK,
  permalink
})
export const makeDigitalContentPublic = (digitalContentId) => ({
  type: MAKE_AGREEMENT_PUBLIC,
  digitalContentId
})

export const fetchDigitalContent = (digitalContentId, slug, handle, canBeUnlisted) => ({
  type: FETCH_AGREEMENT,
  digitalContentId,
  slug,
  handle,
  canBeUnlisted
})
export const fetchDigitalContentSucceeded = (digitalContentId) => ({
  type: FETCH_AGREEMENT_SUCCEEDED,
  digitalContentId
})
export const fetchDigitalContentFailed = (digitalContentId) => ({ type: FETCH_AGREEMENT_FAILED })

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
  type: SET_AGREEMENT_TRENDING_RANKS,
  trendingDigitalContentRanks
})
