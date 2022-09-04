import type { SquareSizes } from '@coliving/common'
import { fetchProfilePicture } from '@coliving/web/src/common/store/cache/users/actions'

import profilePicEmpty from 'app/assets/images/imageProfilePicEmpty2X.png'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'

export const useUserProfilePicture = getUseImageSizeHook<SquareSizes>({
  defaultImageSource: profilePicEmpty,
  action: fetchProfilePicture
})
