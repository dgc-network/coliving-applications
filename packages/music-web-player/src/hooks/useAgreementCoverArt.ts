import { CoverArtSizes, SquareSizes } from '@coliving/common'
import { useDispatch } from 'react-redux'

import imageEmpty from 'assets/img/imageBlank2x.png'
import { useImageSize } from 'common/hooks/useImageSize'
import { fetchCoverArt } from 'common/store/cache/agreements/actions'

export const useAgreementCoverArt = (
  agreementId: number | null | string | undefined,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty as string,
  onDemand = false,
  load = true
) => {
  const dispatch = useDispatch()
  return useImageSize({
    dispatch,
    id: agreementId,
    sizes: coverArtSizes,
    size,
    action: fetchCoverArt,
    defaultImage,
    onDemand,
    load
  })
}
