import { Nullable, BooleanKeys } from '@coliving/common'

import {
  SetAnalyticsUser,
  DigitalContentAnalyticsEvent
} from 'services/nativeMobileInterface/analytics'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'

import packageInfo from '../../../../package.json'

import * as amplitude from './amplitude'
import * as segment from './segment'
const { version } = packageInfo

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production'

let resolveCallback: Nullable<(value?: any) => void> = null
let rejectCallback: Nullable<(value?: any) => void> = null
const didInit = new Promise((resolve, reject) => {
  resolveCallback = resolve
  rejectCallback = reject
})

export const init = async () => {
  try {
    await remoteConfigInstance.waitForRemoteConfig()
    const useAmplitude = remoteConfigInstance.getRemoteVar(
      BooleanKeys.USE_AMPLITUDE
    )
    if (useAmplitude) {
      await amplitude.init()
    } else {
      await segment.init()
    }
    if (resolveCallback) {
      resolveCallback()
    }
  } catch (err) {
    console.error(err)
    if (rejectCallback) {
      rejectCallback(err)
    }
  }
}

let digitalContentCounter = 0

const DIGITAL_CONTENT_LIMIT = 10000

export const digital_content = async (
  event: string,
  properties?: Record<string, any>,
  callback?: () => void
) => {
  try {
    const useAmplitude = remoteConfigInstance.getRemoteVar(
      BooleanKeys.USE_AMPLITUDE
    )

    if (!IS_PRODUCTION_BUILD) {
      console.info(
        `${useAmplitude ? 'Amplitude' : 'Segment'} | digital_content`,
        event,
        properties
      )
    }
    // stop tracking analytics after we reach session limit
    if (digitalContentCounter++ >= DIGITAL_CONTENT_LIMIT) return

    // Add generic digital_content event context for every event
    const propertiesWithContext = {
      ...properties,
      clientVersion: version
    }

    if (NATIVE_MOBILE) {
      const message = new DigitalContentAnalyticsEvent(event, propertiesWithContext)
      message.send()
    } else {
      await didInit
      if (useAmplitude)
        return amplitude.digital_content(event, propertiesWithContext, callback)
      return segment.digital_content(event, propertiesWithContext, {}, callback)
    }
  } catch (err) {
    console.error(err)
  }
}

export const identify = async (
  handle: string,
  traits?: Record<string, any>,
  options?: Record<string, any>,
  callback?: () => void
) => {
  try {
    const useAmplitude = remoteConfigInstance.getRemoteVar(
      BooleanKeys.USE_AMPLITUDE
    )

    if (!IS_PRODUCTION_BUILD) {
      console.info(
        `${useAmplitude ? 'Amplitude' : 'Segment'} | identify`,
        handle,
        traits,
        options
      )
    }

    if (NATIVE_MOBILE) {
      const message = new SetAnalyticsUser(handle, traits)
      message.send()
    } else {
      await didInit
      if (useAmplitude) return amplitude.identify(handle, traits, callback)
      return segment.identify(handle, traits, options, callback)
    }
  } catch (err) {
    console.error(err)
  }
}
