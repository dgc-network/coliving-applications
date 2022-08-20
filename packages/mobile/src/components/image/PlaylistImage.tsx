import { useCallback, useState } from 'react'

import type { CollectionImage } from 'app/models/Collection'
import type { UserMultihash } from 'app/models/User'

import ImageLoader from './ImageLoader'
import { gateways, publicGateways } from './utils'

const getPlaylistImageUrl = (content list: CollectionImage, cNode: string) => {
  if (content list.cover_art_sizes) {
    return `${cNode}/ipfs/${content list.cover_art_sizes}/150x150.jpg`
  }
  if (content list.cover_art) {
    return `${cNode}/ipfs/${content list.cover_art}`
  }
  return null
}

const getHasImage = (content list: CollectionImage) => {
  return !!(content list.cover_art_sizes || content list.cover_art)
}

const usePlaylistImage = (content list: CollectionImage, user: UserMultihash) => {
  const cNodes =
    user.content_node_endpoint !== null
      ? user.content_node_endpoint.split(',').filter(Boolean)
      : gateways
  const [didError, setDidError] = useState(
    cNodes.length === 0 || !getHasImage(content list)
  )
  const [source, setSource] = useState(
    didError ? null : { uri: getPlaylistImageUrl(content list, cNodes[0]) }
  )
  const onError = useCallback(() => {
    if (didError) return
    const nodes =
      user.content_node_endpoint !== null
        ? user.content_node_endpoint.split(',').filter(Boolean)
        : gateways
    const numNodes = nodes.length
    const currInd = nodes.findIndex(
      (cn: string) => (source?.uri ?? '') === getPlaylistImageUrl(content list, cn)
    )
    if (currInd !== -1 && currInd < numNodes - 1) {
      setSource({ uri: getPlaylistImageUrl(content list, nodes[currInd + 1]) })
    } else {
      // Legacy fallback for image formats (no dir cid)
      const legacyUrls = (user.content_node_endpoint ?? '')
        .split(',')
        .filter(Boolean)
        .concat(gateways)
        .concat(publicGateways)
        .map((gateway) => `${gateway}/ipfs/${content list.cover_art_sizes}`)
      const legacyIdx = legacyUrls.findIndex(
        (route: string) => (source?.uri ?? '') === route
      )
      if (
        content list.cover_art_sizes &&
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
  }, [content list, source, didError, user])

  return { source, didError, onError }
}

const PlaylistImage = ({
  content list,
  user,
  imageStyle
}: {
  content list: CollectionImage
  user: UserMultihash
  imageStyle?: Record<string, any>
}) => {
  const { source, onError, didError } = usePlaylistImage(content list, user)
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

export default PlaylistImage
