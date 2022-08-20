import * as schemas from 'schemas'
import { DownloadAgreementMessage } from 'services/native-mobile-interface/downloadAgreement'

import { waitForLibsInit } from './eagerLoadUtils'

const CHECK_DOWNLOAD_AVAILIBILITY_POLLING_INTERVAL = 3000

const updateAgreementDownloadCIDInProgress = new Set([])

class AgreementDownload {
  static async downloadAgreement(cid, contentNodeEndpoints, filename) {
    return window.colivingLibs.File.downloadCID(
      cid,
      contentNodeEndpoints,
      filename
    )
  }

  static async downloadAgreementMobile(cid, creatorNodeGateways, filename) {
    const urls = creatorNodeGateways.map(
      (gateway) => new URL(`${gateway}${cid}?filename=${filename}`)
    )

    const message = new DownloadAgreementMessage({
      filename,
      urls
    })
    message.send()
  }

  /**
   * Updates the download cid for a agreement
   * @param {ID} agreementId
   * @param {AgreementMetadata} metadata
   * @param {string?} cid optional cid to update to, otherwise it is polled for
   */
  static async updateAgreementDownloadCID(agreementId, metadata, cid) {
    await waitForLibsInit()
    if (updateAgreementDownloadCIDInProgress.has(agreementId)) return
    if (metadata.download && metadata.download.cid) return

    updateAgreementDownloadCIDInProgress.add(agreementId)

    const cleanedMetadata = schemas.newAgreementMetadata(metadata, true)
    const account = window.colivingLibs.Account.getCurrentUser()

    if (!cid) {
      cid = await AgreementDownload.checkIfDownloadAvailable(
        agreementId,
        account.content_node_endpoint
      )
    }
    cleanedMetadata.download.cid = cid
    const update = await window.colivingLibs.Agreement.updateAgreement(cleanedMetadata)

    updateAgreementDownloadCIDInProgress.delete(agreementId)
    return update
  }

  static async checkIfDownloadAvailable(agreementId, contentNodeEndpoints) {
    await waitForLibsInit()
    let cid
    while (!cid) {
      try {
        cid = await window.colivingLibs.Agreement.checkIfDownloadAvailable(
          contentNodeEndpoints,
          agreementId
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

export default AgreementDownload
