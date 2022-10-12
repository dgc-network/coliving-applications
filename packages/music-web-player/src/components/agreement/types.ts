import { MouseEvent, ReactNode } from 'react'

import {
  ID,
  UID,
  PlaybackSource,
  Favorite,
  CoverArtSizes,
  Repost,
  FieldVisibility,
  LineupAgreement,
  Remix
} from '@coliving/common'

export enum AgreementTileSize {
  LARGE = 'LARGE',
  SMALL = 'SMALL'
}

export type TileProps = {
  size?: AgreementTileSize
  containerClassName?: string
  index: number
  repostCount: number
  followeeReposts: Repost[]
  followeeSaves: Favorite[]
  hasCurrentUserReposted: boolean
  hasCurrentUserSaved: boolean
  duration: number
  coverArtSizes: CoverArtSizes
  activityTimestamp?: string
  togglePlay: (uid: UID, agreementId: ID, source?: PlaybackSource) => void
  agreementTileStyles?: {}
  uid: UID
  id: ID
  userId: ID
  isActive: boolean
  isPlaying: boolean
  isLoading: boolean
  hasLoaded: (index: number) => void
  goToRoute: (route: string) => void
  isTrending: boolean
  showRankIcon: boolean
}

export type AgreementTileProps = TileProps & {
  title: string
  showLandlordPick?: boolean
  showListens?: boolean
  disableActions?: boolean
  showArtworkIcon?: boolean
  showSkeleton?: boolean
  userSignedIn?: boolean
  listenCount?: number
  saveCount: number
  fieldVisibility?: FieldVisibility
  landlordName: string
  landlordHandle: string
  landlordIsVerified: boolean
  ordered?: boolean
  uploading?: boolean
  uploadPercent?: number
  uploadText?: string
  uploadError?: boolean
  isLandlordPick?: boolean
  isUnlisted?: boolean
  coSign?: Remix | null
  onClickOverflow?: (agreementId: ID) => void
}

export type ContentListTileProps = TileProps & {
  playingUid?: UID | null
  playingAgreementId?: ID | null
  isAlbum: boolean
  isPublic: boolean
  contentTitle: string
  contentListTitle: string
  landlordName: string
  landlordHandle: string
  landlordIsVerified: boolean
  activeAgreementUid: UID | null
  saveCount: number
  agreements: LineupAgreement[]
  agreementCount: number
  showArtworkIcon?: boolean
  showSkeleton?: boolean
  pauseAgreement: () => void
  playAgreement: (uid: UID) => void
  disableActions?: boolean
  ordered?: boolean
  uploading?: boolean
  uploadPercent?: number
  ownerId: ID
  // TODO: remove when making all contentList tiles functional components
  record?: (event: any) => void
  /** Number of rows to show when in loading state, if any */
  numLoadingSkeletonRows?: number
}

export type DesktopAgreementTileProps = {
  /** Size of the digital_content Tile Large or Small */
  size: AgreementTileSize

  /** Prefix order number displayed on the left side of the tile */
  order?: number

  /** The number of plays for the digital_content */
  listenCount?: number

  /** If there is nothing underneath, it's standalone */
  standalone?: boolean

  /** If the digital_content is currently playing */
  isActive: boolean

  /** If the button actions should be clickable */
  isDisabled?: boolean

  /** If the digital_content is unlisted/hidden */
  isUnlisted?: boolean

  /** If digital_content metadata is loading in */
  isLoading?: boolean

  /** Number of rows to show when in loading state, if any */
  numLoadingSkeletonRows?: number

  /** If the landlord selected this digital_content as featured, displays a star and artst pick label */
  isLandlordPick?: boolean

  /** If in dark mode for the bottom buttons to be colored */
  isDarkMode?: boolean

  /** Are we in matrix mode? */
  isMatrixMode: boolean

  /** The artwork for the digital_content tile */
  artwork: ReactNode

  /** The upper most text in the agreementtile */
  header?: ReactNode

  /** The beneath the header is the title, for the digital_content's name */
  title: ReactNode

  /** The beneath the title is the username, for the digital_content's creator */
  userName: ReactNode

  /** The beneath the username is the state, displays the favorite and repost counts */
  stats: ReactNode

  /** The fields which are visible on the digital_content */
  fieldVisibility?: FieldVisibility

  /** Displayed on the bottom right is the kebab icon for menu options */
  rightActions?: ReactNode

  /** Optional bottom bar to be rendered in place of the favorite, repost and share icons */
  bottomBar?: ReactNode

  /** The digital_content's duration in seconds displayed in the top right */
  duration?: number

  /** Class name to be added to the top level container of the agreementtile */
  containerClassName?: string

  /** Incdates if the current user if the creator of the digital_content tile */
  isOwner: boolean

  /** Incdates if the current user has favorited the digital_content */
  isFavorited?: boolean

  /** Incdates if the current user has reposted the digital_content */
  isReposted?: boolean

  /** Incdates if the repost, favorite, and share buttons should be rendered */
  showIconButtons?: boolean

  /** on click title */
  onClickTitle: (e: MouseEvent) => void

  /** on click repost icon */
  onClickRepost: (e?: MouseEvent) => void

  /** on click favorite icon */
  onClickFavorite: (e?: MouseEvent) => void

  /** on click share icon */
  onClickShare: (e?: MouseEvent) => void

  /** On click digital_content tile that's does not trigger another action (ie. button or text) */
  onTogglePlay: (e?: MouseEvent) => void

  /** Are we in a trending lineup? Allows tiles to specialize their rendering */
  isTrending?: boolean

  /** Whether to show an icon indicating rank in lineup */
  showRankIcon: boolean
}

export type DesktopContentListTileProps = {
  /** Size of the digital_content Tile Large or Small */
  size: AgreementTileSize

  /** Prefix order number displayed on the left side of the digital_content tile */
  order?: number

  /** If the digital_content is currently playing */
  isActive: boolean

  /** If the button actions should be clickable */
  isDisabled?: boolean

  /** If digital_content metadata is loading in */
  isLoading?: boolean

  /** Number of rows to show when in loading state, if any */
  numLoadingSkeletonRows?: number

  /** If the landlord selected this digital_content as featured, displays a star and artst pick label */
  isLandlordPick?: boolean

  /** If in dark mode for the bottom buttons to be colored */
  isDarkMode?: boolean

  /** Are we in matrix mode? */
  isMatrixMode: boolean

  /** The artwork for the digital_content tile */
  artwork: ReactNode

  /** The upper most text in the agreementtile */
  header?: ReactNode

  /** The beneath the header is the title, for the digital_content's name */
  title: ReactNode

  /** The beneath the title is the username, for the digital_content's creator */
  userName: ReactNode

  /** The beneath the username is the state, displays the favorite and repost counts */
  stats: ReactNode

  /** Displayed on the bottom right is the kebab icon for menu options */
  rightActions?: ReactNode

  /** Optional bottom bar to be rendered in place of the favorite, repost and share icons */
  bottomBar?: ReactNode

  /** The digital_content's duration in seconds displayed in the top right */
  duration?: number

  /** Class name to be added to the top level container of the contentList tile */
  containerClassName?: string

  /** Class name to be added to the top level container of the agreementtile */
  tileClassName?: string

  /** Class name to be added to the top level container of the agreementlist */
  agreementsContainerClassName?: string

  /** Incdates if the current user if the creator of the digital_content tile */
  isOwner: boolean

  /** Incdates if the current user has favorited the digital_content */
  isFavorited?: boolean

  /** Incdates if the current user has reposted the digital_content */
  isReposted?: boolean

  /** Incdates if the repost, favorite, and share buttons should be rendered */
  showIconButtons?: boolean

  /** on click title */
  onClickTitle: (e: MouseEvent) => void

  /** on click repost icon */
  onClickRepost: (e?: MouseEvent) => void

  /** on click favorite icon */
  onClickFavorite: (e?: MouseEvent) => void

  /** on click share icon */
  onClickShare: (e?: MouseEvent) => void

  /** On click digital_content tile that's does not trigger another action (ie. button or text) */
  onTogglePlay: (e?: MouseEvent) => void

  /** The list of agreements to be rendered under the agreementtile  */
  agreementList: ReactNode[]

  /** The full digital_content count for the contentList (may include agreements not rendered) */
  agreementCount: number

  /** The wrapper react compoenent for the digital_content tile - can be used for drag and drop */
  TileAgreementContainer?: any

  /** Are we in a trending lineup? Allows tiles to specialize their rendering */
  isTrending?: boolean

  /** Whether to show an icon indicating rank in lineup */
  showRankIcon: boolean
}

export type SkeletonTileProps = {
  index?: number
  key: number
  tileSize: AgreementTileSize
  ordered?: boolean
}
