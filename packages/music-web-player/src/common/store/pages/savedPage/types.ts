import {
  UID,
  ID,
  Collection,
  Favorite,
  LineupState,
  LineupDigitalContent
} from '@coliving/common'
import { Moment } from 'moment'

export default interface SavesPageState {
  localSaves: { [id: number]: UID }
  digitalContents: LineupState<{ id: ID; dateSaved: string }>
  saves: Favorite[]
}

export enum Tabs {
  AGREEMENTS = 'AGREEMENTS',
  ALBUMS = 'ALBUMS',
  CONTENT_LISTS = 'CONTENT_LISTS'
}

export type SavedPageDigitalContent = LineupDigitalContent & { dateSaved: string }

export type DigitalContentRecord = SavedPageDigitalContent & {
  key: string
  name: string
  author: string
  handle: string
  date: Moment
  time: number
  plays: number | undefined
}

export type SavedPageCollection = Collection & {
  ownerHandle: string
}
