import {
  UID,
  ID,
  Collection,
  Favorite,
  LineupState,
  LineupAgreement
} from '@coliving/common'
import { Moment } from 'moment'

export default interface SavesPageState {
  localSaves: { [id: number]: UID }
  agreements: LineupState<{ id: ID; dateSaved: string }>
  saves: Favorite[]
}

export enum Tabs {
  AGREEMENTS = 'AGREEMENTS',
  ALBUMS = 'ALBUMS',
  PLAYLISTS = 'PLAYLISTS'
}

export type SavedPageAgreement = LineupAgreement & { dateSaved: string }

export type AgreementRecord = SavedPageAgreement & {
  key: string
  name: string
  artist: string
  handle: string
  date: Moment
  time: number
  plays: number | undefined
}

export type SavedPageCollection = Collection & {
  ownerHandle: string
}
