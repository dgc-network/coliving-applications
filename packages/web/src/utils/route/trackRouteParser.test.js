import { parseAgreementRoute } from './agreementRouteParser'

// eslint-disable-next-line
import { mockDecode } from '__mocks__/Hashids'

describe('parseAgreementRoute', () => {
  it('can parse a handle/slug route', () => {
    const route = '/tartine/morning-buns-25'
    const { slug, agreementId, handle } = parseAgreementRoute(route)
    expect(slug).toEqual('morning-buns-25')
    expect(agreementId).toEqual(null)
    expect(handle).toEqual('tartine')
  })

  it('can decode a hashed agreement id route', () => {
    mockDecode.mockReturnValue([11845])

    const route = '/agreements/eP9k7'
    const { slug, agreementId, handle } = parseAgreementRoute(route)
    expect(slug).toEqual(null)
    expect(agreementId).toEqual(11845)
    expect(handle).toEqual(null)
  })
})
