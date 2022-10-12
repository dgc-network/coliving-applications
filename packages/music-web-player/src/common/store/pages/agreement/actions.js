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

export const getAgreementRanks = (agreementId) => ({ type: GET_AGREEMENT_RANKS, agreementId })
export const setAgreementRank = (duration, rank) => ({
  type: SET_AGREEMENT_RANK,
  duration,
  rank
})
export const resetAgreementPage = (rank) => ({ type: RESET })
export const setAgreementId = (agreementId) => ({ type: SET_AGREEMENT_ID, agreementId })
export const setAgreementPermalink = (permalink) => ({
  type: SET_AGREEMENT_PERMALINK,
  permalink
})
export const makeAgreementPublic = (agreementId) => ({
  type: MAKE_AGREEMENT_PUBLIC,
  agreementId
})

export const fetchAgreement = (agreementId, slug, handle, canBeUnlisted) => ({
  type: FETCH_AGREEMENT,
  agreementId,
  slug,
  handle,
  canBeUnlisted
})
export const fetchAgreementSucceeded = (agreementId) => ({
  type: FETCH_AGREEMENT_SUCCEEDED,
  agreementId
})
export const fetchAgreementFailed = (agreementId) => ({ type: FETCH_AGREEMENT_FAILED })

export const goToRemixesOfParentPage = (parentAgreementId) => ({
  type: GO_TO_REMIXES_OF_PARENT_PAGE,
  parentAgreementId
})

/**
 * Refreshes the lineup based on the digital_content that's currently set.
 * Useful when the lineup's content depends on changes that may
 * happen to the digital_content in view on the digital_content page.
 */
export const refetchLineup = () => ({
  type: REFETCH_LINEUP
})

export const setAgreementTrendingRanks = (trendingAgreementRanks) => ({
  type: SET_AGREEMENT_TRENDING_RANKS,
  trendingAgreementRanks
})
