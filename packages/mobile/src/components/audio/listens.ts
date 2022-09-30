import { EventNames } from 'app/types/analytics'
import { agreement, make } from 'app/utils/analytics'

const IDENTITY_SERVICE_ENDPOINT = 'https://identityservice..co'

export const logListen = async (
  agreementId: number,
  userId: number,
  onFailure: () => void
) => {
  const url = `${IDENTITY_SERVICE_ENDPOINT}/agreements/${agreementId}/listen`
  const method = 'POST'
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
  const body = JSON.stringify({
    userId
  })

  fetch(url, { method, headers, body })
    .then((resp) => {
      console.info(
        `Logged a listen for ${agreementId} for user ${userId}: ${resp.status}`
      )
      agreement(make({ eventName: EventNames.LISTEN, agreementId: `${agreementId}` }))
    })
    .catch((e) => {
      console.error(e)
      onFailure()
    })
}
