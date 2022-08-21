import {
  ID,
  ShareSource,
  Collection,
  Agreement,
  User,
  Nullable
} from '@coliving/common'
import { PayloadAction } from '@reduxjs/toolkit'

export type ShareType =
  | 'agreement'
  | 'profile'
  | 'album'
  | 'contentList'
  | 'liveNftContentList'

type ShareAgreementContent = {
  type: 'agreement'
  agreement: Agreement
  landlord: User
}

type ShareProfileContent = {
  type: 'profile'
  profile: User
}

type ShareAlbumContent = {
  type: 'album'
  album: Collection
  landlord: User
}

type ShareContentListContent = {
  type: 'contentList'
  contentList: Collection
  creator: User
}

type ShareAudioNftContentListContent = {
  type: 'liveNftContentList'
  user: User
}

export type ShareModalContent =
  | ShareAgreementContent
  | ShareProfileContent
  | ShareAlbumContent
  | ShareContentListContent
  | ShareAudioNftContentListContent

export type ShareModalState = {
  source: Nullable<ShareSource>
  content: Nullable<ShareModalContent>
}

type RequestOpenPayload = { source: ShareSource } & (
  | { type: 'agreement'; agreementId: ID }
  | { type: 'profile'; profileId: ID }
  | { type: 'collection'; collectionId: ID }
  | { type: 'liveNftContentList'; userId: ID }
)

export type RequestOpenAction = PayloadAction<RequestOpenPayload>

type OpenPayload = { source: ShareSource } & (
  | ShareAgreementContent
  | ShareProfileContent
  | ShareAlbumContent
  | ShareContentListContent
  | ShareAudioNftContentListContent
)

export type OpenAction = PayloadAction<OpenPayload>
