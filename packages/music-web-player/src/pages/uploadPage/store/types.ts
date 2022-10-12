import { DigitalContentMetadata } from '@coliving/common'

import UploadType from 'pages/uploadPage/components/uploadType'

interface UploadDigitalContent {
  file: File
  preview: any // Basically the Howler.js API, but with underscores.
  metadata: DigitalContentMetadata
}

interface ExtendedDigitalContentMetadata extends DigitalContentMetadata {
  artwork: {
    file: Blob
    url: string
  }
}

export enum ProgressStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE'
}

export type Progress = {
  status: ProgressStatus
  loaded: number
  total: number
}

export interface UploadPageState {
  openMultiDigitalContentNotification: boolean
  digitalContents: UploadDigitalContent[]
  metadata: ExtendedDigitalContentMetadata
  uploadType: UploadType
  uploading: boolean
  uploadProgress: Progress[]
  success: boolean
  error: boolean
  completionId: number
  stems: DigitalContentMetadata[]
  failedDigitalContentIndices: number[]
}
