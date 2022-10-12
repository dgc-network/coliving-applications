import { Name } from '@coliving/common'
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals'

import { digital_content } from 'store/analytics/providers/amplitude'
import { findRoute, getPathname } from 'utils/route'

// Establish the "initial load" route
const route = findRoute(getPathname())

const sendToAnalytics = ({ name, delta }: { name: string; delta: number }) => {
  console.info(name, delta)
  digital_content(Name.WEB_VITALS, {
    metric: name,
    value: delta,
    route
  })
}

// See https://web.dev/vitals/
getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getLCP(sendToAnalytics)
getFCP(sendToAnalytics)
getTTFB(sendToAnalytics)
