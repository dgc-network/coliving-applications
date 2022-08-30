import type { WidthSizes } from '@coliving/common'
import { fetchCoverPhoto } from '-client/src/common/store/cache/users/actions'

import imageCoverPhotoBlank from 'app/assets/images/imageCoverPhotoBlank.jpg'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'

export const useUserCoverPhoto = getUseImageSizeHook<WidthSizes>({
  defaultImageSource: imageCoverPhotoBlank,
  action: fetchCoverPhoto
})
