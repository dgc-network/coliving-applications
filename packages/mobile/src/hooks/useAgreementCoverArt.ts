import type { SquareSizes } from '@coliving/common'
import { fetchCoverArt } from 'coliving-web-client/src/common/store/cache/agreements/actions'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'

export const useAgreementCoverArt = getUseImageSizeHook<SquareSizes>({
  action: fetchCoverArt,
  defaultImageSource: imageEmpty
})
