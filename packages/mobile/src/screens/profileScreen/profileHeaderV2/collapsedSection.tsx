import { View } from 'react-native'

import { Bio } from './bio'
import { ProfileSocials } from './profileSocials'

export const CollapsedSection = () => {
  return (
    <View pointerEvents='box-none'>
      <Bio numberOfLines={2} />
      <ProfileSocials />
    </View>
  )
}
