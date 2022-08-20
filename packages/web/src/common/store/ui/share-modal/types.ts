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
  | 'content list'
  | 'liveNftPlaylist'

type ShareAgreementContent = {
  type: 'agreement'
  agreement: Agreement
  artist: User
}

type ShareProfileContent = {
  type: 'profile'
  profile: User
}

type ShareAlbumContent = {
  type: 'album'
  album: Collection
  artist: User
}

type SharePlaylistContent = {
  type: 'content list'
  content list: Collection
  creator: User
}

type ShareAudioNftPlaylistContent = {
  type: 'liveNftPlaylist'
  user: User
}

export type ShareModalContent =
  | ShareAgreementContent
  | ShareProfileContent
  | ShareAlbumContent
  | SharePlaylistContent
  | ShareAudioNftPlaylistContent

export type ShareModalState = {
  source: Nullable<ShareSource>
  content: Nullable<ShareModalContent>
}

type RequestOpenPayload = { source: ShareSource } & (
  | { type: 'agreement'; agreementId: ID }
  | { type: 'profile'; profileId: ID }
  | { type: 'collection'; collectionId: ID }
  | { type: 'liveNftPlaylist'; userId: ID }
)

export type RequestOpenAction = PayloadAction<RequestOpenPayload>

type OpenPayload = { source: ShareSource } & (
  | ShareAgreementContent
  | ShareProfileContent
  | ShareAlbumContent
  | SharePlaylistContent
  | ShareAudioNftPlaylistContent
)

export type OpenAction = PayloadAction<OpenPayload>
