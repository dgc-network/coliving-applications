import type { Nullable } from '@coliving/common'
import { Platform, Share } from 'react-native'
import type {
  FetchBlobResponse,
  RNFetchBlobConfig,
  StatefulPromise
} from 'rn-fetch-blob'
import RNFetchBlob from 'rn-fetch-blob'

import { dispatch } from 'app/app'
import type { MessageHandlers } from 'app/message/types'
import { MessageType } from 'app/message/types'
import {
  setDownloadedPercentage,
  setFileInfo,
  setFetchCancel
} from 'app/store/download/slice'
import { setVisibility } from 'app/store/drawers/slice'

let fetchTask: Nullable<StatefulPromise<FetchBlobResponse>> = null

const cancelDownloadTask = () => {
  if (fetchTask) {
    fetchTask.cancel()
  }
}

/**
 * Download a file via RNFetchBlob
 */
const download = async ({
  fileUrl,
  fileName,
  directory,
  getFetchConfig,
  onFetchComplete
}: {
  fileUrl: string
  fileName: string
  directory: string
  getFetchConfig: (filePath: string) => RNFetchBlobConfig
  onFetchComplete?: (response: FetchBlobResponse) => Promise<void>
}) => {
  const filePath = directory + '/' + fileName

  try {
    fetchTask = RNFetchBlob.config(getFetchConfig(filePath)).fetch(
      'GET',
      fileUrl
    )

    // Do this while download is occuring
    // TODO: The RNFetchBlob library is currently broken for download progress events on Android.
    fetchTask.progress({ interval: 250 }, (received, total) => {
      dispatch(setDownloadedPercentage((received / total) * 100))
    })

    const fetchRes = await fetchTask

    // Do this after download is done
    dispatch(setVisibility({ drawer: 'DownloadDigitalContentProgress', visible: false }))

    await onFetchComplete?.(fetchRes)
  } catch (err) {
    console.error(err)

    // On failure attempt to delete the file
    try {
      await RNFetchBlob.fs.unlink(filePath)
    } catch {}
  }
}

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.DOWNLOAD_DIGITAL_CONTENT]: async ({ message }) => {
    const fileUrl = message.urls.find(
      (url) => url !== null && url !== undefined
    )
    const fileName = message.filename
    const digitalContentName = fileName.split('.').slice(0, -1).join('')

    dispatch(setVisibility({ drawer: 'DownloadDigitalContentProgress', visible: true }))
    dispatch(setFileInfo({ digitalContentName, fileName }))
    dispatch(setFetchCancel(cancelDownloadTask))

    if (Platform.OS === 'ios') {
      download({
        fileUrl,
        fileName,
        directory: RNFetchBlob.fs.dirs.DocumentDir,
        getFetchConfig: (filePath) => ({
          // On iOS fetch & cache the digital_content, let user choose where to download it
          // with the share sheet, then delete the cached copy of the digital_content.
          fileCache: true,
          path: filePath
        }),
        onFetchComplete: async (fetchRes) => {
          await Share.share({
            url: fetchRes.path()
          })
          fetchRes.flush()
        }
      })
    } else {
      download({
        fileUrl,
        fileName,
        directory: RNFetchBlob.fs.dirs.DownloadDir,
        getFetchConfig: (filePath) => ({
          // On android save to FS and trigger notification that it is saved
          addAndroidDownloads: {
            description: digitalContentName,
            mediaScannable: true,
            mime: 'digitalcoin/mpeg',
            notification: true,
            path: filePath,
            title: digitalContentName,
            useDownloadManager: true
          }
        })
      })
    }
  }
}
