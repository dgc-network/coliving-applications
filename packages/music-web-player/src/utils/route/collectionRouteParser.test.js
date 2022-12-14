import { parseCollectionRoute } from './collectionRouteParser'

// eslint-disable-next-line
import { mockDecode } from '__mocks__/hashids'

describe('parseCollectionRoute', () => {
  it('can decode a contentList id route', () => {
    const route = '/arizmendi/contentList/croissants-11'
    const { title, collectionId, handle, collectionType } =
      parseCollectionRoute(route)
    expect(title).toEqual('croissants')
    expect(collectionId).toEqual(11)
    expect(handle).toEqual('arizmendi')
    expect(collectionType).toEqual('contentList')
  })

  it('can decode an album id route', () => {
    const route = '/arizmendi/album/scones-20'
    const { title, collectionId, handle, collectionType } =
      parseCollectionRoute(route)
    expect(title).toEqual('scones')
    expect(collectionId).toEqual(20)
    expect(handle).toEqual('arizmendi')
    expect(collectionType).toEqual('album')
  })

  it('can decode a hashed collection id route', () => {
    mockDecode.mockReturnValue([11845])

    const route = '/contentLists/eP9k7'
    const { title, collectionId, handle, collectionType } =
      parseCollectionRoute(route)
    expect(title).toEqual(null)
    expect(collectionId).toEqual(11845)
    expect(handle).toEqual(null)
    expect(collectionType).toEqual(null)
  })

  it('returns null for invalid id in contentList id route', () => {
    const route = '/arizmendi/contentList/name-asdf'
    const params = parseCollectionRoute(route)
    expect(params).toEqual(null)
  })

  it('returns null for invalid id in album id route', () => {
    const route = '/arizmendi/album/name-asdf'
    const params = parseCollectionRoute(route)
    expect(params).toEqual(null)
  })

  it('returns null for invalid id in hashed collection id route', () => {
    mockDecode.mockReturnValue([NaN])

    const route = '/contentLists/asdf'
    const params = parseCollectionRoute(route)
    expect(params).toEqual(null)
  })
})
