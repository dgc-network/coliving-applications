import { EventNames } from 'app/types/analytics'
import { digital_content, make } from 'app/utils/analytics'

const IDENTITY_SERVICE_ENDPOINT = 'https://identityservice..co'

export const logListen = async (
  digitalContentId: number,
  userId: number,
  onFailure: () => void
) => {
  const url = `${IDENTITY_SERVICE_ENDPOINT}/digital_contents/${digitalContentId}/listen`
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
        `Logged a listen for ${digitalContentId} for user ${userId}: ${resp.status}`
      )
      digital_content(make({ eventName: EventNames.LISTEN, digitalContentId: `${digitalContentId}` }))
    })
    .catch((e) => {
      console.error(e)
      onFailure()
    })
}
