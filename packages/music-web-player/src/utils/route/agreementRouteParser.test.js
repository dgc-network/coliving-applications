import { parseDigitalContentRoute } from './digitalContentRouteParser'

// eslint-disable-next-line
import { mockDecode } from '__mocks__/hashids'

describe('parseDigitalContentRoute', () => {
  it('can parse a handle/slug route', () => {
    const route = '/tartine/morning-buns-25'
    const { slug, digitalContentId, handle } = parseDigitalContentRoute(route)
    expect(slug).toEqual('morning-buns-25')
    expect(digitalContentId).toEqual(null)
    expect(handle).toEqual('tartine')
  })

  it('can decode a hashed digital_content id route', () => {
    mockDecode.mockReturnValue([11845])

    const route = '/digital_contents/eP9k7'
    const { slug, digitalContentId, handle } = parseDigitalContentRoute(route)
    expect(slug).toEqual(null)
    expect(digitalContentId).toEqual(11845)
    expect(handle).toEqual(null)
  })
})
