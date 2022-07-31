import type { SquareSizes } from '@/common'
import { fetchProfilePicture } from '-client/src/common/store/cache/users/actions'

import profilePicEmpty from 'app/assets/images/imageProfilePicEmpty2X.png'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'

export const useUserProfilePicture = getUseImageSizeHook<SquareSizes>({
  defaultImageSource: profilePicEmpty,
  action: fetchProfilePicture
})