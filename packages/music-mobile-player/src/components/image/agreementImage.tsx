import { useCallback, useState } from 'react'

import type { AgreementImage as AgreementImageType } from 'app/models/digital_content'
import type { UserMultihash } from 'app/models/user'

import ImageLoader from './imageLoader'
import { gateways, publicGateways } from './utils'

const getAgreementImageUrl = (digital_content: AgreementImageType, cNode: string) => {
  if (digital_content.cover_art_sizes) {
    return `${cNode}/ipfs/${digital_content.cover_art_sizes}/150x150.jpg`
  }
  if (digital_content.cover_art) {
    return `${cNode}/ipfs/${digital_content.cover_art}`
  }
  return null
}

const getHasImage = (digital_content: AgreementImageType) => {
  return !!(digital_content.cover_art_sizes || digital_content.cover_art)
}

const useAgreementImage = (digital_content: AgreementImageType, user: UserMultihash) => {
  const cNodes =
    user.content_node_endpoint !== null
      ? user.content_node_endpoint.split(',').filter(Boolean)
      : gateways
  const [didError, setDidError] = useState(
    cNodes.length === 0 || !getHasImage(digital_content)
  )
  const [source, setSource] = useState(
    didError ? null : { uri: getAgreementImageUrl(digital_content, cNodes[0]) }
  )
  const onError = useCallback(() => {
    if (didError) return
    const nodes =
      user.content_node_endpoint !== null
        ? user.content_node_endpoint.split(',').filter(Boolean)
        : gateways
    const numNodes = nodes.length
    const currInd = nodes.findIndex(
      (cn: string) => (source?.uri ?? '') === getAgreementImageUrl(digital_content, cn)
    )
    if (currInd !== 1 && currInd < numNodes - 1) {
      setSource({ uri: getAgreementImageUrl(digital_content, nodes[currInd + 1]) })
    } else {
      // Legacy fallback for image formats (no dir cid)
      const legacyUrls = (user.content_node_endpoint ?? '')
        .split(',')
        .filter(Boolean)
        .concat(gateways)
        .concat(publicGateways)
        .map((gateway) => `${gateway}/ipfs/${digital_content.cover_art_sizes}`)
      const legacyIdx = legacyUrls.findIndex(
        (route: string) => (source?.uri ?? '') === route
      )
      if (
        digital_content.cover_art_sizes &&
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
  }, [user, digital_content, source, didError])
  return { source, didError, onError }
}

const AgreementImage = ({
  digital_content,
  user,
  imageStyle
}: {
  digital_content: AgreementImageType
  user: UserMultihash
  imageStyle?: Record<string, any>
}) => {
  const { source, onError, didError } = useAgreementImage(digital_content, user)
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

export default AgreementImage
