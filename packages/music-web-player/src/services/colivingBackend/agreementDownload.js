import * as schemas from 'schemas'
import { DownloadDigitalContentMessage } from 'services/native-mobile-interface/downloadDigitalContent'

import { waitForLibsInit } from './eagerLoadUtils'

const CHECK_DOWNLOAD_AVAILIBILITY_POLLING_INTERVAL = 3000

const updateDigitalContentDownloadCIDInProgress = new Set([])

class DigitalContentDownload {
  static async downloadDigitalContent(cid, contentNodeEndpoints, filename) {
    return window.colivingLibs.File.downloadCID(
      cid,
      contentNodeEndpoints,
      filename
    )
  }

  static async downloadDigitalContentMobile(cid, contentNodeGateways, filename) {
    const urls = contentNodeGateways.map(
      (gateway) => new URL(`${gateway}${cid}?filename=${filename}`)
    )

    const message = new DownloadDigitalContentMessage({
      filename,
      urls
    })
    message.send()
  }

  /**
   * Updates the download cid for a digital_content
   * @param {ID} digitalContentId
   * @param {DigitalContentMetadata} metadata
   * @param {string?} cid optional cid to update to, otherwise it is polled for
   */
  static async updateDigitalContentDownloadCID(digitalContentId, metadata, cid) {
    await waitForLibsInit()
    if (updateDigitalContentDownloadCIDInProgress.has(digitalContentId)) return
    if (metadata.download && metadata.download.cid) return

    updateDigitalContentDownloadCIDInProgress.add(digitalContentId)

    const cleanedMetadata = schemas.newDigitalContentMetadata(metadata, true)
    const account = window.colivingLibs.Account.getCurrentUser()

    if (!cid) {
      cid = await DigitalContentDownload.checkIfDownloadAvailable(
        digitalContentId,
        account.content_node_endpoint
      )
    }
    cleanedMetadata.download.cid = cid
    const update = await window.colivingLibs.DigitalContent.updateDigitalContent(cleanedMetadata)

    updateDigitalContentDownloadCIDInProgress.delete(digitalContentId)
    return update
  }

  static async checkIfDownloadAvailable(digitalContentId, contentNodeEndpoints) {
    await waitForLibsInit()
    let cid
    while (!cid) {
      try {
        cid = await window.colivingLibs.DigitalContent.checkIfDownloadAvailable(
          contentNodeEndpoints,
          digitalContentId
        )
      } catch (e) {
        console.error(e)
        return null
      }
      await new Promise((resolve) =>
        setTimeout(resolve, CHECK_DOWNLOAD_AVAILIBILITY_POLLING_INTERVAL)
      )
    }
    return cid
  }
}

export default DigitalContentDownload
