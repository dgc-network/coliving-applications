import {
  ID,
  ShareSource,
  Collection,
  DigitalContent,
  User,
  Nullable
} from '@coliving/common'
import { PayloadAction } from '@reduxjs/toolkit'

export type ShareType =
  | 'digital_content'
  | 'profile'
  | 'album'
  | 'contentList'
  | 'liveNftContentList'

type ShareDigitalContent = {
  type: 'digital_content'
  digital_content: DigitalContent
  author: User
}

type ShareProfileContent = {
  type: 'profile'
  profile: User
}

type ShareAlbumContent = {
  type: 'album'
  album: Collection
  author: User
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
  | ShareDigitalContent
  | ShareProfileContent
  | ShareAlbumContent
  | ShareContentListContent
  | ShareAudioNftContentListContent

export type ShareModalState = {
  source: Nullable<ShareSource>
  content: Nullable<ShareModalContent>
}

type RequestOpenPayload = { source: ShareSource } & (
  | { type: 'digital_content'; digitalContentId: ID }
  | { type: 'profile'; profileId: ID }
  | { type: 'collection'; collectionId: ID }
  | { type: 'liveNftContentList'; userId: ID }
)

export type RequestOpenAction = PayloadAction<RequestOpenPayload>

type OpenPayload = { source: ShareSource } & (
  | ShareDigitalContent
  | ShareProfileContent
  | ShareAlbumContent
  | ShareContentListContent
  | ShareAudioNftContentListContent
)

export type OpenAction = PayloadAction<OpenPayload>
