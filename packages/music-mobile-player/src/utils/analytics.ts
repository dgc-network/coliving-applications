import { Amplitude } from '@amplitude/react-native'
import Config from 'react-native-config'
import VersionNumber from 'react-native-version-number'

import type { Identify, DigitalContent, Screen, AllEvents } from '../types/analytics'
import { EventNames } from '../types/analytics'

let analyticsSetupStatus: 'ready' | 'pending' | 'error' = 'pending'

const AmplitudeWriteKey = Config.AMPLITUDE_WRITE_KEY
const ampInstance = Amplitude.getInstance()

export const setup = async () => {
  try {
    console.info('Analytics setup')
    if (AmplitudeWriteKey) {
      await ampInstance.init(AmplitudeWriteKey)
      analyticsSetupStatus = 'ready'
      console.info('Analytics ready')
    } else {
      analyticsSetupStatus = 'error'
      console.info('Analytics unable to setup: missing amplitude write key')
    }
  } catch (err) {
    analyticsSetupStatus = 'error'
    console.info('Analytics error')
    console.log(err)
  }
}

const isColivingSetup = async () => {
  if (analyticsSetupStatus === 'pending') {
    const ready = await new Promise((resolve, reject) => {
      const checkStatusInterval = setInterval(() => {
        if (analyticsSetupStatus === 'pending') return
        clearInterval(checkStatusInterval)
        if (analyticsSetupStatus === 'ready') resolve(true)
        resolve(false)
      }, 500)
    })
    return ready
  } else if (analyticsSetupStatus === 'ready') return true
  else {
    return false
  }
}

export const make = (event: AllEvents) => {
  const { eventName, ...props } = event
  return {
    eventName,
    properties: props as any
  }
}

// Identify User
// Docs: https://segment.com/docs/connections/spec/identify
export const identify = async ({ handle, traits = {} }: Identify) => {
  const isSetup = await isColivingSetup()
  if (!isSetup) return
  console.info('Analytics identify', handle, traits)
  ampInstance.setUserId(handle)
  ampInstance.setUserProperties(traits)
}

// DigitalContent Event
// Docs: https://segment.com/docs/connections/spec/digital_content/
export const digital_content = async ({ eventName, properties }: DigitalContent) => {
  const isSetup = await isColivingSetup()
  if (!isSetup) return
  const version = VersionNumber.appVersion
  const propertiesWithContext = {
    ...properties,
    mobileClientVersion: version
  }
  console.info('Analytics digital_content', eventName, propertiesWithContext)
  ampInstance.logEvent(eventName, propertiesWithContext)
}

// Screen Event
// Docs: https://segment.com/docs/connections/sources/catalog/libraries/mobile/react-native/#screen
export const screen = async ({ route, properties = {} }: Screen) => {
  const isSetup = await isColivingSetup()
  if (!isSetup) return
  console.info('Analytics screen', route, properties)
  ampInstance.logEvent(EventNames.PAGE_VIEW, { route, ...properties })
}
