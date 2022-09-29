import { useCallback, useState } from 'react'

import type { CollectionImage } from 'app/models/collection'
import type { UserMultihash } from 'app/models/user'

import ImageLoader from './imageLoader'
import { gateways, publicGateways } from './utils'

const getContentListImageUrl = (contentList: CollectionImage, cNode: string) => {
  if (contentList.cover_art_sizes) {
    return `${cNode}/ipfs/${contentList.cover_art_sizes}/150x150.jpg`
  }
  if (contentList.cover_art) {
    return `${cNode}/ipfs/${contentList.cover_art}`
  }
  return null
}

const getHasImage = (contentList: CollectionImage) => {
  return !!(contentList.cover_art_sizes || contentList.cover_art)
}

const useContentListImage = (contentList: CollectionImage, user: UserMultihash) => {
  const cNodes =
    user.content_node_endpoint !== null
      ? user.content_node_endpoint.split(',').filter(Boolean)
      : gateways
  const [didError, setDidError] = useState(
    cNodes.length === 0 || !getHasImage(contentList)
  )
  const [source, setSource] = useState(
    didError ? null : { uri: getContentListImageUrl(contentList, cNodes[0]) }
  )
  const onError = useCallback(() => {
    if (didError) return
    const nodes =
      user.content_node_endpoint !== null
        ? user.content_node_endpoint.split(',').filter(Boolean)
        : gateways
    const numNodes = nodes.length
    const currInd = nodes.findIndex(
      (cn: string) => (source?.uri ?? '') === getContentListImageUrl(contentList, cn)
    )
    if (currInd !== -1 && currInd < numNodes - 1) {
      setSource({ uri: getContentListImageUrl(contentList, nodes[currInd + 1]) })
    } else {
      // Legacy fallback for image formats (no dir cid)
      const legacyUrls = (user.content_node_endpoint ?? '')
        .split(',')
        .filter(Boolean)
        .concat(gateways)
        .concat(publicGateways)
        .map((gateway) => `${gateway}/ipfs/${contentList.cover_art_sizes}`)
      const legacyIdx = legacyUrls.findIndex(
        (route: string) => (source?.uri ?? '') === route
      )
      if (
        contentList.cover_art_sizes &&
        source?.uri?.endsWith('.jpg') &&
        legacyUrls.length > 0
      ) {
        setSource({ uri: legacyUrls[0] })
      } else if (legacyIdx !== -1 && legacyIdx < legacyUrls.length - 1) {
        setSource({ uri: legacyUrls[legacyIdx + 1] })
      } else {
        setDidError(true)
      }
    }
  }, [contentList, source, didError, user])

  return { source, didError, onError }
}

const ContentListImage = ({
  contentList,
  user,
  imageStyle
}: {
  contentList: CollectionImage
  user: UserMultihash
  imageStyle?: Record<string, any>
}) => {
  const { source, onError, didError } = useContentListImage(contentList, user)
  return (
    <ImageLoader
      style={imageStyle}
      source={
        didError || source === null
          ? require('app/assets/images/imageBlank2x.png')
          : source
      }
      onError={onError}
    />
  )
}

export default ContentListImage
