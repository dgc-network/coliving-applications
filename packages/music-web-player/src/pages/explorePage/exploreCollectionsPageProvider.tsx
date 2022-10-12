import { useEffect, useState, useCallback, ComponentType } from 'react'

import { ID, FavoriteType } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { matchPath } from 'react-router'
import { useHistory } from 'react-router-dom'
import { Dispatch } from 'redux'

import {
  getCollections,
  getStatus
} from 'common/store/pages/explore/exploreCollections/selectors'
import { fetch } from 'common/store/pages/explore/exploreCollections/slice'
import { ExploreCollectionsVariant } from 'common/store/pages/explore/types'
import { setFavorite } from 'common/store/userList/favorites/actions'
import { setRepost } from 'common/store/userList/reposts/actions'
import { RepostType } from 'common/store/userList/reposts/types'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'
import {
  EXPLORE_MOOD_CONTENT_LISTS_PAGE,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  getPathname
} from 'utils/route'

import {
  EXPLORE_COLLECTIONS_MAP,
  ExploreCollection,
  ExploreMoodCollection,
  EXPLORE_MOOD_COLLECTIONS_MAP
} from './collections'
import { CollectionsPageProps as DesktopCollectionsPageProps } from './components/desktop/collectionsPage'
import { CollectionsPageProps as MobileCollectionsPageProps } from './components/mobile/collectionsPage'

type OwnProps = {
  isMobile: boolean
  variant: ExploreCollectionsVariant
  children:
    | ComponentType<MobileCollectionsPageProps>
    | ComponentType<DesktopCollectionsPageProps>
}

type ExploreCollectionsPageProviderProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ExploreCollectionsPageProvider = ({
  isMobile,
  variant,
  collections,
  status,
  goToRoute,
  fetch,
  setRepostContentListId,
  setFavoriteContentListId,
  setRepostUsers,
  setFavoriteUsers,
  setModalVisibility,
  children: Children
}: ExploreCollectionsPageProviderProps) => {
  const { location } = useHistory()
  const [info, setInfo] = useState<
    ExploreCollection | ExploreMoodCollection | null
  >(null)

  const onClickReposts = useCallback(
    (id: ID) => {
      if (isMobile) {
        setRepostContentListId(id)
        goToRoute(REPOSTING_USERS_ROUTE)
      } else {
        setRepostUsers(id)
        setModalVisibility()
      }
    },
    [
      isMobile,
      setRepostContentListId,
      goToRoute,
      setRepostUsers,
      setModalVisibility
    ]
  )
  const onClickFavorites = useCallback(
    (id: ID) => {
      if (isMobile) {
        setFavoriteContentListId(id)
        goToRoute(FAVORITING_USERS_ROUTE)
      } else {
        setFavoriteUsers(id)
        setModalVisibility()
      }
    },
    [
      isMobile,
      setFavoriteContentListId,
      goToRoute,
      setFavoriteUsers,
      setModalVisibility
    ]
  )

  useEffect(() => {
    if (variant === ExploreCollectionsVariant.MOOD) {
      // Mood contentList
      const match = matchPath<{
        mood: string
      }>(getPathname(location), {
        path: EXPLORE_MOOD_CONTENT_LISTS_PAGE
      })
      if (match && match.params.mood) {
        const collectionInfo = EXPLORE_MOOD_COLLECTIONS_MAP[match.params.mood]
        fetch(variant, collectionInfo.moods)
        setInfo(collectionInfo)
      }
    } else if (variant === ExploreCollectionsVariant.DIRECT_LINK) {
      // no-op
    } else {
      // Other contentList/albums types (e.g. Top ContentList)
      fetch(variant)
      setInfo(EXPLORE_COLLECTIONS_MAP[variant])
    }
  }, [variant, fetch, location])

  const title = info
    ? info.variant === ExploreCollectionsVariant.MOOD
      ? `${info.title} ContentLists`
      : info.title
    : ''
  const description = info ? info.subtitle || '' : ''

  const childProps = {
    title,
    description,
    collections,
    status,
    onClickReposts,
    onClickFavorites,
    goToRoute
  }

  const mobileProps = {}

  const desktopProps = {}

  return <Children {...childProps} {...mobileProps} {...desktopProps} />
}

function mapStateToProps(state: AppState, props: OwnProps) {
  return {
    collections: getCollections(state, { variant: props.variant }),
    status: getStatus(state, { variant: props.variant })
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetch: (variant: ExploreCollectionsVariant, moods?: string[]) =>
      dispatch(fetch({ variant, moods })),
    setRepostContentListId: (collectionId: ID) =>
      dispatch(setRepost(collectionId, RepostType.COLLECTION)),
    setFavoriteContentListId: (collectionId: ID) =>
      dispatch(setFavorite(collectionId, FavoriteType.CONTENT_LIST)),
    setRepostUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.COLLECTION,
          id: digitalContentID
        })
      ),
    setFavoriteUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.COLLECTION,
          id: digitalContentID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true)),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ExploreCollectionsPageProvider)
