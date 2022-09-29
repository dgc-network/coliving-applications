import { AgreementMetadata } from '@coliving/common'

import UploadType from 'pages/uploadPage/components/uploadType'

interface UploadAgreement {
  file: File
  preview: any // Basically the Howler.js API, but with underscores.
  metadata: AgreementMetadata
}

interface ExtendedAgreementMetadata extends AgreementMetadata {
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
  openMultiAgreementNotification: boolean
  agreements: UploadAgreement[]
  metadata: ExtendedAgreementMetadata
  uploadType: UploadType
  uploading: boolean
  uploadProgress: Progress[]
  success: boolean
  error: boolean
  completionId: number
  stems: AgreementMetadata[]
  failedAgreementIndices: number[]
}
