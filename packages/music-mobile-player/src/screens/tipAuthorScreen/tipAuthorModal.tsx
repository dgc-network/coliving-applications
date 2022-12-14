import { useEffect } from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { resetSend } from '@coliving/web/src/common/store/tipping/slice'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'

import { useAppScreenOptions } from '../appScreen/useAppScreenOptions'

import { ConfirmSendTipScreen } from './confirmSendTipScreen'
import { SendTipScreen } from './sendTipScreen'
import { TipSentScreen } from './tipSentScreen'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const TipLandlordModal = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)
  const dispatchWeb = useDispatchWeb()

  useEffect(() => {
    return () => {
      dispatchWeb(resetSend())
    }
  }, [dispatchWeb])

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name='SendTip' component={SendTipScreen} />
      <Stack.Screen name='ConfirmTip' component={ConfirmSendTipScreen} />
      <Stack.Screen name='TipSent' component={TipSentScreen} />
    </Stack.Navigator>
  )
}
