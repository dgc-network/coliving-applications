import type { ReactElement } from 'react'

import type { ID, UID, Kind, Lineup as LineupData, Maybe } from '@coliving/common'
import type { LineupActions } from '@coliving/web/src/common/store/lineup/actions'
import type { SectionListProps } from 'react-native'

export enum LineupVariant {
  MAIN = 'main',
  CONTENT_LIST = 'contentList'
}

export type LineupItem = {
  id: ID
  kind: Kind
  digital_content_id?: ID
  content_list_id?: ID
  uid: UID
  _marked_deleted?: boolean
  activityTimestamp?: Maybe<number | string>
}

export type LoadingLineupItem = {
  _loading: true
}

export type FeedTipLineupItem = {
  _feedTip: true
}

export type LineupProps = {
  /** Object containing lineup actions such as setPage */
  actions: LineupActions

  /** The maximum number of total digitalContents to fetch */
  count?: number

  /**
   * Whether or not to delineate the lineup by time of the `activityTimestamp`
   */
  delineate?: boolean

  /**
   * Do not scroll to top of lineup when containing tab navigator tab is pressed
   */
  disableTopTabScroll?: boolean

  /**
   * Optional payload to pass to the fetch action
   */
  fetchPayload?: any

  /**
   * A header to display at the top of the lineup,
   * will scroll with the rest of the content
   */
  header?: SectionListProps<unknown>['ListHeaderComponent']

  /** Are we in a trending lineup? Allows tiles to specialize their rendering */
  isTrending?: boolean

  /** Whether we are in the feed lineup */
  isFeed?: boolean

  /**
   * Indicator if a digital_content should be displayed differently (ie. author pick)
   * The leadingElementId is displayed at the top of the lineup
   */
  leadingElementId?: ID

  /**
   * A custom delineator to show after the leading element
   */
  leadingElementDelineator?: ReactElement

  /** The number of digitalContents to fetch in each request */
  limit?: number

  /**
   * The Lineup object containing entries
   */
  lineup: LineupData<LineupItem>

  /**
   * Function called to load more entries
   */
  loadMore?: (offset: number, limit: number, overwrite: boolean) => void

  /**
   * Function called on refresh
   */
  refresh?: () => void

  /**
   * Boolean indicating if currently fetching data for a refresh
   * Must be provided if `refresh` is provided
   */
  refreshing?: boolean

  /**
   * How many icons to show for top ranked entries in the lineup. Defaults to 0, showing none
   */
  rankIconCount?: number

  /**
   * Is the lineup responsible for initially fetching it's own data
   */
  selfLoad?: boolean

  /**
   * Whether to show the author pick on the leading element.
   * Defaults to true.
   */
  showLeadingElementLandlordPick?: boolean

  /**
   * Which item to start the lineup at (previous items will not be rendered)
   */
  start?: number

  /**
   * The variant of the Lineup
   */
  variant?: LineupVariant

  /**
   * Uniquely identifies Lineup's SectionList. Needed if rendered inside
   * another VirtualizedList.
   */
  listKey?: string

  /**
   * When `true` don't load more while lineup status is `LOADING`.
   * This helps prevent collisions with any in-flight loading from web-app
   */
  includeLineupStatus?: boolean
} & Pick<
  SectionListProps<unknown>,
  'showsVerticalScrollIndicator' | 'ListEmptyComponent'
>
