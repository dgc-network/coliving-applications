import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { getAgreement } from 'app/store/digitalcoin/selectors'

import { PLAY_BAR_HEIGHT } from '../nowPlayingDrawer'

export const PlayBarChin = () => {
  const agreementInfo = useSelector(getAgreement)
  return <View style={{ height: agreementInfo ? PLAY_BAR_HEIGHT : 0 }} />
}
