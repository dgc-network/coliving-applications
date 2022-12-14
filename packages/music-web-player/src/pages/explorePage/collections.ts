import { ReactNode } from 'react'

import { ReactComponent as IconCassette } from 'assets/img/iconCassette.svg'
import { ReactComponent as IconExploreDJ } from 'assets/img/iconExploreDJ.svg'
import { ReactComponent as IconExploreTopAlbums } from 'assets/img/iconExploreTopAlbums.svg'
import { ReactComponent as IconExploreTopContentLists } from 'assets/img/iconExploreTopContentLists.svg'
import { ExploreCollectionsVariant } from 'common/store/pages/explore/types'
import {
  EXPLORE_LET_THEM_DJ_PAGE,
  EXPLORE_TOP_ALBUMS_PAGE,
  exploreMoodContentListsPage,
  TRENDING_CONTENT_LISTS_PAGE,
  TRENDING_UNDERGROUND_PAGE
} from 'utils/route'

export type ExploreCollection = {
  variant: ExploreCollectionsVariant
  title: string
  subtitle?: string
  gradient: string
  shadow: string
  icon?: ReactNode
  incentivized?: boolean // Whether we reward winners with Audio
  link: string
  cardSensitivity?: number
}

export type ExploreMoodCollection = ExploreCollection & {
  emoji: string
  moods: string[]
}

// How much full width cards move
const WIDE_CARD_SENSITIVTY = 0.04

export const LET_THEM_DJ: ExploreCollection = {
  variant: ExploreCollectionsVariant.LET_THEM_DJ,
  title: 'Let Them DJ',
  subtitle: 'ContentLists created by the people you follow',
  gradient: 'linear-gradient(315deg, #08AEEA 0%, #2AF598 100%)',
  shadow: 'rgba(9,175,233,0.35)',
  icon: IconExploreDJ,
  link: EXPLORE_LET_THEM_DJ_PAGE
}

export const TOP_ALBUMS: ExploreCollection = {
  variant: ExploreCollectionsVariant.TOP_ALBUMS,
  title: 'Top Albums',
  subtitle: 'The top albums from all of Coliving',
  gradient: 'linear-gradient(135deg, #FF00B6 0%, #B000FF 100%)',
  shadow: 'rgba(177,0,253,0.35)',
  icon: IconExploreTopAlbums,
  link: EXPLORE_TOP_ALBUMS_PAGE
}

export const TRENDING_CONTENT_LISTS: ExploreCollection = {
  variant: ExploreCollectionsVariant.DIRECT_LINK,
  title: 'Trending ContentLists',
  subtitle: 'The top contentLists on Coliving right now',
  gradient: 'linear-gradient(315deg, #57ABFF 0%, #CD98FF 100%)',
  shadow: 'rgba(87,170,255,0.35)',
  icon: IconExploreTopContentLists,
  link: TRENDING_CONTENT_LISTS_PAGE,
  incentivized: true,
  cardSensitivity: WIDE_CARD_SENSITIVTY
}

export const TRENDING_UNDERGROUND: ExploreCollection = {
  variant: ExploreCollectionsVariant.DIRECT_LINK,
  title: 'Underground Trending',
  subtitle: 'Some of the best up-and-coming music on Coliving all in one place',
  gradient: 'linear-gradient(315deg, #BA27FF 0%, #EF8CD9 100%)',
  shadow: 'rgba(242, 87, 255, 0.35)',
  icon: IconCassette,
  link: TRENDING_UNDERGROUND_PAGE,
  incentivized: true,
  cardSensitivity: WIDE_CARD_SENSITIVTY
}

export const CHILL_CONTENT_LISTS: ExploreMoodCollection = {
  variant: ExploreCollectionsVariant.MOOD,
  title: 'Chill',
  emoji: 'dove-of-peace',
  gradient: 'linear-gradient(135deg, #2CD1FF 0%, #FA8BFF 100%)',
  shadow: 'rgba(237,144,255,0.35)',
  link: exploreMoodContentListsPage('chill'),
  moods: ['peaceful', 'easygoing', 'melancholy']
}

export const PROVOKING_CONTENT_LISTS: ExploreMoodCollection = {
  variant: ExploreCollectionsVariant.MOOD,
  title: 'Provoking',
  emoji: 'thinking-face',
  gradient: 'linear-gradient(135deg, #3FECF4 0%, #16A085 100%)',
  shadow: 'rgba(115,225,179,0.35)',
  link: exploreMoodContentListsPage('provoking'),
  moods: ['sophisticated', 'brooding', 'serious', 'stirring']
}

export const INTIMATE_CONTENT_LISTS: ExploreMoodCollection = {
  variant: ExploreCollectionsVariant.MOOD,
  title: 'Intimate',
  emoji: 'heart-with-arrow',
  gradient: 'linear-gradient(315deg, #F24FDF 0%, #C881FF 100%)',
  shadow: 'rgba(241,81,225,0.35)',
  link: exploreMoodContentListsPage('intimate'),
  moods: ['sentimental', 'romantic', 'yearning', 'sensual', 'tender']
}

export const UPBEAT_CONTENT_LISTS: ExploreMoodCollection = {
  variant: ExploreCollectionsVariant.MOOD,
  title: 'Upbeat',
  emoji: 'person-raising-both-hands-in-celebration',
  gradient: 'linear-gradient(135deg, #896BFF 0%, #0060FF 100%)',
  shadow: 'rgba(11,97,255,0.35)',
  link: exploreMoodContentListsPage('upbeat'),
  moods: ['upbeat', 'excited', 'energizing', 'empowering', 'cool']
}

export const INTENSE_CONTENT_LISTS: ExploreMoodCollection = {
  variant: ExploreCollectionsVariant.MOOD,
  title: 'Intense',
  emoji: 'fire',
  gradient: 'linear-gradient(315deg, #FBAB7E 0%, #F7CE68 100%)',
  shadow: 'rgba(250,173,124,0.35)',
  link: exploreMoodContentListsPage('intense'),
  moods: ['rowdy', 'fiery', 'defiant', 'aggressive', 'gritty']
}

export const EXPLORE_COLLECTIONS_MAP = {
  [ExploreCollectionsVariant.LET_THEM_DJ]: LET_THEM_DJ,
  [ExploreCollectionsVariant.TOP_ALBUMS]: TOP_ALBUMS
}

type ExploreMoodMap = { [key in string]: ExploreMoodCollection }
export const EXPLORE_MOOD_COLLECTIONS_MAP: ExploreMoodMap = {
  chill: CHILL_CONTENT_LISTS,
  provoking: PROVOKING_CONTENT_LISTS,
  intimate: INTIMATE_CONTENT_LISTS,
  upbeat: UPBEAT_CONTENT_LISTS,
  intense: INTENSE_CONTENT_LISTS
}
