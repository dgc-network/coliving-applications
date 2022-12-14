import { ID, Status } from '@coliving/common'

export enum Tabs {
  FOR_YOU = 'FOR YOU',
  MOODS = 'MOODS',
  CONTENT_LISTS = 'CONTENT_LISTS',
  PROFILES = 'PROFILES'
}

export type ExploreContent = {
  featuredContentLists: ID[]
  featuredProfiles: ID[]
}

export default interface ExplorePageState {
  status: Status
  contentLists: ID[]
  profiles: ID[]
  tab: Tabs
}

export enum ExploreCollectionsVariant {
  LET_THEM_DJ = 'Let Them DJ',
  TOP_ALBUMS = 'Top Albums',
  MOOD = 'Mood',
  DIRECT_LINK = 'Direct Link'
}
