import { ComponentType, useEffect } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { getAccountUser } from 'common/store/account/selectors'
import { makeGetExplore } from 'common/store/pages/explore/selectors'
import { fetchExplore } from 'common/store/pages/explore/slice'
import { formatCount } from 'common/utils/formatUtil'
import { AppState } from 'store/types'

import { ExplorePageProps as DesktopExplorePageProps } from './components/desktop/explorePage'
import { ExplorePageProps as MobileExplorePageProps } from './components/mobile/explorePage'

const messages = {
  title: 'Explore',
  description: 'Explore featured content on Coliving'
}

type OwnProps = {
  children:
    | ComponentType<MobileExplorePageProps>
    | ComponentType<DesktopExplorePageProps>
}

type ExplorePageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const ExplorePage = ({
  account,
  explore,
  fetchExplore,
  goToRoute,
  children: Children
}: ExplorePageProps) => {
  useEffect(() => {
    fetchExplore()
  }, [fetchExplore])

  const formatContentListCardSecondaryText = (saves: number, digitalContents: number) => {
    const savesText = saves === 1 ? 'Favorite' : 'Favorites'
    const digitalContentsText = digitalContents === 1 ? 'DigitalContent' : 'DigitalContents'
    return `${formatCount(saves)} ${savesText} • ${digitalContents} ${digitalContentsText}`
  }

  const formatProfileCardSecondaryText = (followers: number) => {
    const followersText = followers === 1 ? 'Follower' : 'Followers'
    return `${formatCount(followers)} ${followersText}`
  }

  const childProps = {
    title: messages.title,
    description: messages.description,
    // Props from AppState
    account,
    contentLists: explore.contentLists,
    profiles: explore.profiles,
    status: explore.status,
    formatContentListCardSecondaryText,
    formatProfileCardSecondaryText,

    // Props from dispatch
    goToRoute
  }

  const mobileProps = {}

  const desktopProps = {}

  return <Children {...childProps} {...mobileProps} {...desktopProps} />
}

function makeMapStateToProps() {
  const getExplore = makeGetExplore()
  const mapStateToProps = (state: AppState) => {
    return {
      account: getAccountUser(state),
      explore: getExplore(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchExplore: () => dispatch(fetchExplore()),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(ExplorePage)
)
