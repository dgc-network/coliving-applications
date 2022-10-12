import { CoverArtSizes, SquareSizes } from '@coliving/common'
import { useDispatch } from 'react-redux'

import imageEmpty from 'assets/img/imageBlank2x.png'
import { useImageSize } from 'common/hooks/useImageSize'
import { fetchCoverArt } from 'common/store/cache/digital_contents/actions'

export const useDigitalContentCoverArt = (
  digitalContentId: number | null | string | undefined,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty as string,
  onDemand = false,
  load = true
) => {
  const dispatch = useDispatch()
  return useImageSize({
    dispatch,
    id: digitalContentId,
    sizes: coverArtSizes,
    size,
    action: fetchCoverArt,
    defaultImage,
    onDemand,
    load
  })
}
