import { useCallback, useState } from 'react'

import type { AgreementImage as AgreementImageType } from 'app/models/Agreement'
import type { UserMultihash } from 'app/models/User'

import ImageLoader from './ImageLoader'
import { gateways, publicGateways } from './utils'

const getAgreementImageUrl = (agreement: AgreementImageType, cNode: string) => {
  if (agreement.cover_art_sizes) {
    return `${cNode}/ipfs/${agreement.cover_art_sizes}/150x150.jpg`
  }
  if (agreement.cover_art) {
    return `${cNode}/ipfs/${agreement.cover_art}`
  }
  return null
}

const getHasImage = (agreement: AgreementImageType) => {
  return !!(agreement.cover_art_sizes || agreement.cover_art)
}

const useAgreementImage = (agreement: AgreementImageType, user: UserMultihash) => {
  const cNodes =
    user.content_node_endpoint !== null
      ? user.content_node_endpoint.split(',').filter(Boolean)
      : gateways
  const [didError, setDidError] = useState(
    cNodes.length === 0 || !getHasImage(agreement)
  )
  const [source, setSource] = useState(
    didError ? null : { uri: getAgreementImageUrl(agreement, cNodes[0]) }
  )
  const onError = useCallback(() => {
    if (didError) return
    const nodes =
      user.content_node_endpoint !== null
        ? user.content_node_endpoint.split(',').filter(Boolean)
        : gateways
    const numNodes = nodes.length
    const currInd = nodes.findIndex(
      (cn: string) => (source?.uri ?? '') === getAgreementImageUrl(agreement, cn)
    )
    if (currInd !== 1 && currInd < numNodes - 1) {
      setSource({ uri: getAgreementImageUrl(agreement, nodes[currInd + 1]) })
    } else {
      // Legacy fallback for image formats (no dir cid)
      const legacyUrls = (user.content_node_endpoint ?? '')
        .split(',')
        .filter(Boolean)
        .concat(gateways)
        .concat(publicGateways)
        .map((gateway) => `${gateway}/ipfs/${agreement.cover_art_sizes}`)
      const legacyIdx = legacyUrls.findIndex(
        (route: string) => (source?.uri ?? '') === route
      )
      if (
        agreement.cover_art_sizes &&
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
  }, [user, agreement, source, didError])
  return { source, didError, onError }
}

const AgreementImage = ({
  agreement,
  user,
  imageStyle
}: {
  agreement: AgreementImageType
  user: UserMultihash
  imageStyle?: Record<string, any>
}) => {
  const { source, onError, didError } = useAgreementImage(agreement, user)
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
