import { ID } from '@coliving/common'
import { matchPath } from 'react-router-dom'

import { AGREEMENT_ID_PAGE, AGREEMENT_PAGE } from 'utils/route'

import { decodeHashId } from './hashIds'

export type AgreementRouteParams =
  | { slug: string; agreementId: null; handle: string }
  | { slug: null; agreementId: ID; handle: null }
  | null

/**
 * Parses a agreement route into slug, agreement id, and handle
 * If the route is a hash id route, agreement title and handle are not returned, and vice versa
 * @param route
 */
export const parseAgreementRoute = (route: string): AgreementRouteParams => {
  const agreementIdPageMatch = matchPath<{ id: string }>(route, {
    path: AGREEMENT_ID_PAGE,
    exact: true
  })
  if (agreementIdPageMatch) {
    const agreementId = decodeHashId(agreementIdPageMatch.params.id)
    if (agreementId === null) return null
    return { slug: null, agreementId, handle: null }
  }

  const agreementPageMatch = matchPath<{ slug: string; handle: string }>(route, {
    path: AGREEMENT_PAGE,
    exact: true
  })
  if (agreementPageMatch) {
    const { handle, slug } = agreementPageMatch.params
    return { slug, agreementId: null, handle }
  }

  return null
}
