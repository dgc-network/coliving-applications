import { ID } from '@coliving/common'
import { matchPath } from 'react-router-dom'

import { AGREEMENT_ID_PAGE, AGREEMENT_PAGE } from 'utils/route'

import { decodeHashId } from './hashIds'

export type DigitalContentRouteParams =
  | { slug: string; digitalContentId: null; handle: string }
  | { slug: null; digitalContentId: ID; handle: null }
  | null

/**
 * Parses a digital_content route into slug, digital_content id, and handle
 * If the route is a hash id route, digital_content title and handle are not returned, and vice versa
 * @param route
 */
export const parseDigitalContentRoute = (route: string): DigitalContentRouteParams => {
  const digitalContentIdPageMatch = matchPath<{ id: string }>(route, {
    path: AGREEMENT_ID_PAGE,
    exact: true
  })
  if (digitalContentIdPageMatch) {
    const digitalContentId = decodeHashId(digitalContentIdPageMatch.params.id)
    if (digitalContentId === null) return null
    return { slug: null, digitalContentId, handle: null }
  }

  const digitalContentPageMatch = matchPath<{ slug: string; handle: string }>(route, {
    path: AGREEMENT_PAGE,
    exact: true
  })
  if (digitalContentPageMatch) {
    const { handle, slug } = digitalContentPageMatch.params
    return { slug, digitalContentId: null, handle }
  }

  return null
}
