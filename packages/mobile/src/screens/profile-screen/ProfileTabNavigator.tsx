import type { ReactNode } from 'react'

import type { Animated } from 'react-native'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconCollectibles from 'app/assets/images/iconCollectibles.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconContentLists from 'app/assets/images/iconContentLists.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import {
  collapsibleTabScreen,
  CollapsibleTabNavigator
} from 'app/components/top-tab-bar'
import { useRoute } from 'app/hooks/useRoute'

import { AlbumsTab } from './AlbumsTab'
import { CollectiblesTab } from './CollectiblesTab'
import { ContentListsTab } from './ContentListsTab'
import { RepostsTab } from './RepostsTab'
import { AgreementsTab } from './AgreementsTab'
import { useSelectProfile } from './selectors'
import { useShouldShowCollectiblesTab } from './utils'

type ProfileTabNavigatorProps = {
  /**
   * Function that renders the collapsible header
   */
  renderHeader: () => ReactNode

  /**
   * Animated value to capture scrolling. If unset, an
   * animated value is created.
   */
  animatedValue?: Animated.Value

  refreshing?: boolean
  onRefresh?: () => void
}

export const ProfileTabNavigator = ({
  renderHeader,
  animatedValue,
  refreshing,
  onRefresh
}: ProfileTabNavigatorProps) => {
  const { user_id, agreement_count } = useSelectProfile(['user_id', 'agreement_count'])
  const { params } = useRoute<'Profile'>()

  const initialParams = { id: user_id, handle: params.handle }

  const isLandlord = agreement_count > 0

  const showCollectiblesTab = useShouldShowCollectiblesTab()

  const agreementScreen = collapsibleTabScreen({
    name: 'Agreements',
    Icon: IconNote,
    component: AgreementsTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const albumsScreen = collapsibleTabScreen({
    name: 'Albums',
    Icon: IconAlbum,
    component: AlbumsTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const contentListsScreen = collapsibleTabScreen({
    name: 'ContentLists',
    Icon: IconContentLists,
    component: ContentListsTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const repostsScreen = collapsibleTabScreen({
    name: 'Reposts',
    Icon: IconRepost,
    component: RepostsTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const collectiblesScreen = collapsibleTabScreen({
    name: 'Collectibles',
    Icon: IconCollectibles,
    component: CollectiblesTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  if (isLandlord) {
    return (
      <CollapsibleTabNavigator
        renderHeader={renderHeader}
        animatedValue={animatedValue}
      >
        {agreementScreen}
        {albumsScreen}
        {contentListsScreen}
        {repostsScreen}
        {showCollectiblesTab ? collectiblesScreen : null}
      </CollapsibleTabNavigator>
    )
  }

  return (
    <CollapsibleTabNavigator
      renderHeader={renderHeader}
      animatedValue={animatedValue}
    >
      {repostsScreen}
      {contentListsScreen}
      {showCollectiblesTab ? collectiblesScreen : null}
    </CollapsibleTabNavigator>
  )
}
