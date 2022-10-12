import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { getDigitalContent } from 'app/store/digitalcoin/selectors'

import { PLAY_BAR_HEIGHT } from '../nowPlayingDrawer'

export const PlayBarChin = () => {
  const digitalContentInfo = useSelector(getDigitalContent)
  return <View style={{ height: digitalContentInfo ? PLAY_BAR_HEIGHT : 0 }} />
}
