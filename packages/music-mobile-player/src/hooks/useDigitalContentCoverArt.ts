import type { SquareSizes } from '@coliving/common'
import { fetchCoverArt } from '@coliving/web/src/common/store/cache/digital_contents/actions'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'

export const useDigitalContentCoverArt = getUseImageSizeHook<SquareSizes>({
  action: fetchCoverArt,
  defaultImageSource: imageEmpty
})
