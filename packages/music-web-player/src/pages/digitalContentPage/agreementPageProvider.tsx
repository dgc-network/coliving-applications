import { Component, ComponentType } from 'react'

import {
  ID,
  CID,
  PlayableType,
  FollowSource,
  FavoriteSource,
  RepostSource,
  ShareSource,
  Name,
  PlaybackSource,
  FavoriteType,
  Status,
  DigitalContent,
  Uid
} from '@coliving/common'
import { push as pushRoute, replace } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getUserId } from 'common/store/account/selectors'
import * as cacheDigitalContentActions from 'common/store/cache/digital_contents/actions'
import { makeGetLineupMetadatas } from 'common/store/lineup/selectors'
import * as digitalContentPageActions from 'common/store/pages/digital_content/actions'
import { digitalContentsActions } from 'common/store/pages/digital_content/lineup/actions'
import {
  getUser,
  getLineup,
  getDigitalContentRank,
  getDigitalContent,
  getRemixParentDigitalContent,
  getStatus,
  getSourceSelector,
  getDigitalContentPermalink
} from 'common/store/pages/digital_content/selectors'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialDigitalContentsActions from 'common/store/social/digital_contents/actions'
import * as socialUsersActions from 'common/store/social/users/actions'
import { open } from 'common/store/ui/mobileOverflowMenu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobileOverflowMenu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/shareModal/slice'
import { setFavorite } from 'common/store/userList/favorites/actions'
import { setRepost } from 'common/store/userList/reposts/actions'
import { RepostType } from 'common/store/userList/reposts/types'
import { getCanonicalName } from 'common/utils/genres'
import { formatSeconds, formatDate } from 'common/utils/timeUtil'
import * as unfollowConfirmationActions from 'components/unfollowConfirmationModal/store/actions'
import DeletedPage from 'pages/deletedPage/deletedPage'
import { DigitalContentEvent, make } from 'store/analytics/actions'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { getLocationPathname } from 'store/routing/selectors'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'
import {
  profilePage,
  searchResultsPage,
  NOT_FOUND_PAGE,
  FEED_PAGE,
  FAVORITING_USERS_ROUTE,
  REPOSTING_USERS_ROUTE,
  fullDigitalContentPage,
  digitalContentRemixesPage
} from 'utils/route'
import { parseDigitalContentRoute, DigitalContentRouteParams } from 'utils/route/digitalContentRouteParser'
import { getDigitalContentPageTitle, getDigitalContentPageDescription } from 'utils/seo'

import StemsSEOHint from './components/stemsSEOHint'
import { OwnProps as DesktopDigitalContentPageProps } from './components/desktop/digitalContentPage'
import { OwnProps as MobileDigitalContentPageProps } from './components/mobile/digitalContentPage'
import { TRENDING_BADGE_LIMIT } from './store/sagas'

const getRemixParentDigitalContentId = (digital_content: DigitalContent | null) =>
  digital_content?.remix_of?.digitalContents?.[0]?.parent_digital_content_id

type OwnProps = {
  children:
    | ComponentType<MobileDigitalContentPageProps>
    | ComponentType<DesktopDigitalContentPageProps>
}

type mapStateProps = ReturnType<typeof makeMapStateToProps>
type DigitalContentPageProviderProps = OwnProps &
  ReturnType<mapStateProps> &
  ReturnType<typeof mapDispatchToProps>

type DigitalContentPageProviderState = {
  pathname: string
  ownerHandle: string | null
  showDeleteConfirmation: boolean
  routeKey: ID
  source: string | undefined
}

class DigitalContentPageProvider extends Component<
  DigitalContentPageProviderProps,
  DigitalContentPageProviderState
> {
  state: DigitalContentPageProviderState = {
    pathname: this.props.pathname,
    ownerHandle: null,
    showDeleteConfirmation: false,
    routeKey: parseDigitalContentRoute(this.props.pathname)?.digitalContentId ?? 0,
    source: undefined
  }

  componentDidMount() {
    const params = parseDigitalContentRoute(this.props.pathname)
    // Go to 404 if the digital_content id isn't parsed correctly or if should redirect
    if (!params || (params.digitalContentId && shouldRedirectDigitalContent(params.digitalContentId))) {
      this.props.goToRoute(NOT_FOUND_PAGE)
      return
    }

    this.fetchDigitalContents(params)
  }

  componentDidUpdate(prevProps: DigitalContentPageProviderProps) {
    const {
      pathname,
      digital_content,
      status,
      refetchDigitalContentsLinup,
      user,
      digitalContentPermalink
    } = this.props
    if (status === Status.ERROR) {
      this.props.goToRoute(NOT_FOUND_PAGE)
    }
    if (user && user.is_deactivated) {
      this.goToProfilePage(user.handle)
    }
    if (!isMobile()) {
      // On componentDidUpdate we try to reparse the URL because if you’re on a digital_content page
      // and go to another digital_content page, the component doesn’t remount but we need to
      // trigger a re-fetch based on the URL. On mobile, separate page provider components are
      // used so this is a non-issue.
      if (pathname !== this.state.pathname) {
        const params = parseDigitalContentRoute(pathname)
        if (params) {
          this.setState({ pathname })
          this.fetchDigitalContents(params)
        }
      }
    }

    // Set the lineup source in state once it's set in redux
    if (
      !this.state.source &&
      this.state.routeKey === this.props.digital_content?.digital_content_id
    ) {
      this.setState({ source: this.props.source })
    }

    // If the remix of this digital_content changed and we have
    // already fetched the digital_content, refetch the entire lineup
    // because the remix parent digital_content needs to be retrieved
    if (
      prevProps.digital_content &&
      prevProps.digital_content.digital_content_id &&
      digital_content &&
      digital_content.digital_content_id &&
      getRemixParentDigitalContentId(prevProps.digital_content) !== getRemixParentDigitalContentId(digital_content)
    ) {
      refetchDigitalContentsLinup()
    }

    if (digital_content) {
      const params = parseDigitalContentRoute(pathname)
      if (params) {
        // Check if we are coming from a non-canonical route and replace route if necessary.
        const { slug, handle } = params
        if (slug === null || handle === null) {
          if (digital_content.permalink) {
            this.props.replaceRoute(digital_content.permalink)
          }
        } else {
          // Reroute to the most recent permalink if necessary in case user edits the digital_content
          // name, which changes the permalink
          if (
            pathname === this.state.pathname &&
            prevProps.digital_content?.digital_content_id === digital_content?.digital_content_id &&
            digitalContentPermalink &&
            digitalContentPermalink !== pathname
          ) {
            // The path is going to change but don't re-fetch as we already have the digital_content
            this.setState({ pathname: digitalContentPermalink })
            this.props.replaceRoute(digitalContentPermalink)
          }
        }
      }
    }
  }

  componentWillUnmount() {
    if (!isMobile()) {
      // Don't reset on mobile because there are two
      // digital_content pages mounted at a time due to animations.
      this.props.resetDigitalContentPage()
    }
  }

  fetchDigitalContents = (params: NonNullable<DigitalContentRouteParams>) => {
    const { digital_content } = this.props
    const { slug, digitalContentId, handle } = params

    // Go to feed if the digital_content is deleted
    if (digital_content && digital_content.digital_content_id === digitalContentId) {
      if (digital_content._marked_deleted) {
        this.props.goToRoute(FEED_PAGE)
        return
      }
    }
    this.props.reset()
    if (digitalContentId) {
      this.props.setDigitalContentId(digitalContentId)
    }
    if (slug && handle) {
      this.props.setDigitalContentPermalink(`/${handle}/${slug}`)
    }
    this.props.fetchDigitalContent(digitalContentId, slug || '', handle || '', !!(slug && handle))
    if (handle) {
      this.setState({ ownerHandle: handle })
    }
  }

  onHeroPlay = (heroPlaying: boolean) => {
    const {
      play,
      pause,
      currentQueueItem,
      moreByLandlord: { entries },
      record
    } = this.props
    if (!entries || !entries[0]) return
    const digital_content = entries[0]

    if (heroPlaying) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${digital_content.id}`,
          source: PlaybackSource.AGREEMENT_PAGE
        })
      )
    } else if (
      currentQueueItem.uid !== digital_content.uid &&
      currentQueueItem.digital_content &&
      currentQueueItem.digital_content.digital_content_id === digital_content.id
    ) {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${digital_content.id}`,
          source: PlaybackSource.AGREEMENT_PAGE
        })
      )
    } else if (digital_content) {
      play(digital_content.uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${digital_content.id}`,
          source: PlaybackSource.AGREEMENT_PAGE
        })
      )
    }
  }

  onMoreByLandlordDigitalContentsPlay = (uid?: string) => {
    const { play, recordPlayMoreByLandlord } = this.props
    play(uid)
    if (uid) {
      const digitalContentId = Uid.fromString(uid).id
      recordPlayMoreByLandlord(digitalContentId)
    }
  }

  onHeroRepost = (isReposted: boolean, digitalContentId: ID) => {
    const { repostDigitalContent, undoRepostDigitalContent } = this.props
    if (!isReposted) {
      repostDigitalContent(digitalContentId)
    } else {
      undoRepostDigitalContent(digitalContentId)
    }
  }

  onHeroShare = (digitalContentId: ID) => {
    const { shareDigitalContent } = this.props
    shareDigitalContent(digitalContentId)
  }

  onSaveDigitalContent = (isSaved: boolean, digitalContentId: ID) => {
    const { saveDigitalContent, unsaveDigitalContent } = this.props
    if (isSaved) {
      unsaveDigitalContent(digitalContentId)
    } else {
      saveDigitalContent(digitalContentId)
    }
  }

  onFollow = () => {
    const { onFollow, digital_content } = this.props
    if (digital_content) onFollow(digital_content.owner_id)
  }

  onUnfollow = () => {
    const { onUnfollow, onConfirmUnfollow, digital_content } = this.props
    if (digital_content) {
      if (this.props.isMobile) {
        onConfirmUnfollow(digital_content.owner_id)
      } else {
        onUnfollow(digital_content.owner_id)
      }
    }
  }

  goToProfilePage = (handle: string) => {
    this.props.goToRoute(profilePage(handle))
  }

  goToSearchResultsPage = (tag: string) => {
    this.props.goToRoute(searchResultsPage(tag))
    this.props.recordTagClick(tag.replace('#', ''))
  }

  goToParentRemixesPage = () => {
    const { goToRemixesOfParentPage, digital_content } = this.props
    const parentDigitalContentId = getRemixParentDigitalContentId(digital_content)
    if (parentDigitalContentId) {
      goToRemixesOfParentPage(parentDigitalContentId)
    }
  }

  goToAllRemixesPage = () => {
    const { digital_content } = this.props
    if (digital_content) {
      this.props.goToRoute(digitalContentRemixesPage(digital_content.permalink))
    }
  }

  goToFavoritesPage = (digitalContentId: ID) => {
    this.props.setFavoriteDigitalContentId(digitalContentId)
    this.props.goToRoute(FAVORITING_USERS_ROUTE)
  }

  goToRepostsPage = (digitalContentId: ID) => {
    this.props.setRepostDigitalContentId(digitalContentId)
    this.props.goToRoute(REPOSTING_USERS_ROUTE)
  }

  onClickReposts = () => {
    this.props.digital_content && this.props.setRepostUsers(this.props.digital_content.digital_content_id)
    this.props.setModalVisibility()
  }

  onClickFavorites = () => {
    this.props.digital_content && this.props.setFavoriteUsers(this.props.digital_content.digital_content_id)
    this.props.setModalVisibility()
  }

  render() {
    const {
      digital_content,
      remixParentDigitalContent,
      user,
      digitalContentRank,
      moreByLandlord,
      currentQueueItem,
      playing,
      buffering,
      userId,
      pause,
      downloadDigitalContent,
      onExternalLinkClick
    } = this.props
    const heroPlaying =
      playing &&
      !!digital_content &&
      !!currentQueueItem.digital_content &&
      currentQueueItem.digital_content.digital_content_id === digital_content.digital_content_id
    const badge =
      digitalContentRank.year && digitalContentRank.year <= TRENDING_BADGE_LIMIT
        ? `#${digitalContentRank.year} This Year`
        : digitalContentRank.month && digitalContentRank.month <= TRENDING_BADGE_LIMIT
        ? `#${digitalContentRank.month} This Month`
        : digitalContentRank.week && digitalContentRank.week <= TRENDING_BADGE_LIMIT
        ? `#${digitalContentRank.week} This Week`
        : null

    const desktopProps = {
      // Follow Props
      onFollow: this.onFollow,
      onUnfollow: this.onUnfollow,
      makePublic: this.props.makeDigitalContentPublic,
      onClickReposts: this.onClickReposts,
      onClickFavorites: this.onClickFavorites
    }

    const title = getDigitalContentPageTitle({
      title: digital_content ? digital_content.title : '',
      handle: user ? user.handle : ''
    })

    const releaseDate = digital_content ? digital_content.release_date || digital_content.created_at : ''
    const description = getDigitalContentPageDescription({
      releaseDate: releaseDate ? formatDate(releaseDate) : '',
      description: digital_content?.description ?? '',
      mood: digital_content?.mood ?? '',
      genre: digital_content ? getCanonicalName(digital_content.genre) : '',
      duration: digital_content ? formatSeconds(digital_content.duration) : '',
      tags: digital_content ? (digital_content.tags || '').split(',').filter(Boolean) : []
    })
    const canonicalUrl = user && digital_content ? fullDigitalContentPage(digital_content.permalink) : ''

    // If the digital_content has a remix parent and it's not deleted and the original's owner is not deactivated.
    const hasValidRemixParent =
      !!getRemixParentDigitalContentId(digital_content) &&
      !!remixParentDigitalContent &&
      remixParentDigitalContent.is_delete === false &&
      !remixParentDigitalContent.user?.is_deactivated

    if ((digital_content?.is_delete || digital_content?._marked_deleted) && user) {
      // DigitalContent has not been blocked and is content-available, meaning the owner
      // deleted themselves via transaction.
      const deletedByLandlord = !digital_content._blocked && digital_content.is_available

      return (
        <DeletedPage
          title={title}
          description={description}
          canonicalUrl={canonicalUrl}
          playable={{ metadata: digital_content, type: PlayableType.AGREEMENT }}
          user={user}
          deletedByLandlord={deletedByLandlord}
        />
      )
    }

    const childProps = {
      title,
      description,
      canonicalUrl,
      heroDigitalContent: digital_content,
      hasValidRemixParent,
      user,
      heroPlaying,
      userId,
      badge,
      onHeroPlay: this.onHeroPlay,
      goToProfilePage: this.goToProfilePage,
      goToSearchResultsPage: this.goToSearchResultsPage,
      goToAllRemixesPage: this.goToAllRemixesPage,
      goToParentRemixesPage: this.goToParentRemixesPage,
      onHeroRepost: this.onHeroRepost,
      onHeroShare: this.onHeroShare,
      onSaveDigitalContent: this.onSaveDigitalContent,
      onDownloadDigitalContent: downloadDigitalContent,
      onClickMobileOverflow: this.props.clickOverflow,
      onConfirmUnfollow: this.props.onConfirmUnfollow,
      goToFavoritesPage: this.goToFavoritesPage,
      goToRepostsPage: this.goToRepostsPage,

      // DigitalContents Lineup Props
      digitalContents: moreByLandlord,
      currentQueueItem,
      isPlaying: playing,
      isBuffering: buffering,
      play: this.onMoreByLandlordDigitalContentsPlay,
      pause,
      onExternalLinkClick
    }

    return (
      <>
        {!!digital_content?._stems?.[0] && <StemsSEOHint />}
        <this.props.children
          key={this.state.routeKey}
          {...childProps}
          {...desktopProps}
        />
      </>
    )
  }
}

const REDIRECT_AGREEMENT_ID_RANGE = [416972, 418372]
const shouldRedirectDigitalContent = (digitalContentId: ID) =>
  digitalContentId >= REDIRECT_AGREEMENT_ID_RANGE[0] && digitalContentId <= REDIRECT_AGREEMENT_ID_RANGE[1]

function makeMapStateToProps() {
  const getMoreByLandlordLineup = makeGetLineupMetadatas(getLineup)
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    return {
      source: getSourceSelector(state),
      digital_content: getDigitalContent(state),
      digitalContentPermalink: getDigitalContentPermalink(state),
      remixParentDigitalContent: getRemixParentDigitalContent(state),
      user: getUser(state),
      status: getStatus(state),
      moreByLandlord: getMoreByLandlordLineup(state),
      userId: getUserId(state),

      currentQueueItem: getCurrentQueueItem(state),
      playing: getPlaying(state),
      buffering: getBuffering(state),
      digitalContentRank: getDigitalContentRank(state),
      isMobile: isMobile(),
      pathname: getLocationPathname(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchDigitalContent: (
      digitalContentId: number | null,
      slug: string,
      ownerHandle: string,
      canBeUnlisted: boolean
    ) =>
      dispatch(
        digitalContentPageActions.fetchDigitalContent(digitalContentId, slug, ownerHandle, canBeUnlisted)
      ),
    setDigitalContentId: (digitalContentId: number) =>
      dispatch(digitalContentPageActions.setDigitalContentId(digitalContentId)),
    setDigitalContentPermalink: (permalink: string) =>
      dispatch(digitalContentPageActions.setDigitalContentPermalink(permalink)),
    resetDigitalContentPage: () => dispatch(digitalContentPageActions.resetDigitalContentPage()),
    makeDigitalContentPublic: (digitalContentId: ID) =>
      dispatch(digitalContentPageActions.makeDigitalContentPublic(digitalContentId)),

    goToRoute: (route: string) => dispatch(pushRoute(route)),
    replaceRoute: (route: string) => dispatch(replace(route)),
    reset: (source?: string) => dispatch(digitalContentsActions.reset(source)),
    play: (uid?: string) => dispatch(digitalContentsActions.play(uid)),
    recordPlayMoreByLandlord: (digitalContentId: ID) => {
      const digitalContentEvent: DigitalContentEvent = make(Name.AGREEMENT_PAGE_PLAY_MORE, {
        id: digitalContentId
      })
      dispatch(digitalContentEvent)
    },
    pause: () => dispatch(digitalContentsActions.pause()),
    shareDigitalContent: (digitalContentId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'digital_content',
          digitalContentId,
          source: ShareSource.PAGE
        })
      ),
    saveDigitalContent: (digitalContentId: ID) =>
      dispatch(
        socialDigitalContentsActions.saveDigitalContent(digitalContentId, FavoriteSource.AGREEMENT_PAGE)
      ),
    unsaveDigitalContent: (digitalContentId: ID) =>
      dispatch(
        socialDigitalContentsActions.unsaveDigitalContent(digitalContentId, FavoriteSource.AGREEMENT_PAGE)
      ),
    deleteDigitalContent: (digitalContentId: ID) =>
      dispatch(cacheDigitalContentActions.deleteDigitalContent(digitalContentId)),
    repostDigitalContent: (digitalContentId: ID) =>
      dispatch(
        socialDigitalContentsActions.repostDigitalContent(digitalContentId, RepostSource.AGREEMENT_PAGE)
      ),
    undoRepostDigitalContent: (digitalContentId: ID) =>
      dispatch(
        socialDigitalContentsActions.undoRepostDigitalContent(digitalContentId, RepostSource.AGREEMENT_PAGE)
      ),
    editDigitalContent: (digitalContentId: ID, formFields: any) =>
      dispatch(cacheDigitalContentActions.editDigitalContent(digitalContentId, formFields)),
    onFollow: (userId: ID) =>
      dispatch(socialUsersActions.followUser(userId, FollowSource.AGREEMENT_PAGE)),
    onUnfollow: (userId: ID) =>
      dispatch(
        socialUsersActions.unfollowUser(userId, FollowSource.AGREEMENT_PAGE)
      ),
    onConfirmUnfollow: (userId: ID) =>
      dispatch(unfollowConfirmationActions.setOpen(userId)),
    downloadDigitalContent: (
      digitalContentId: ID,
      cid: CID,
      contentNodeEndpoints: string,
      category?: string,
      parentDigitalContentId?: ID
    ) => {
      dispatch(
        socialDigitalContentsActions.downloadDigitalContent(
          digitalContentId,
          cid,
          contentNodeEndpoints,
          category
        )
      )
      const digitalContentEvent: DigitalContentEvent = make(Name.AGREEMENT_PAGE_DOWNLOAD, {
        id: digitalContentId,
        category,
        parent_digital_content_id: parentDigitalContentId
      })
      dispatch(digitalContentEvent)
    },
    clickOverflow: (digitalContentId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.AGREEMENTS, id: digitalContentId, overflowActions })
      ),
    setRepostDigitalContentId: (digitalContentId: ID) =>
      dispatch(setRepost(digitalContentId, RepostType.AGREEMENT)),
    setFavoriteDigitalContentId: (digitalContentId: ID) =>
      dispatch(setFavorite(digitalContentId, FavoriteType.AGREEMENT)),
    onExternalLinkClick: (event: any) => {
      const digitalContentEvent: DigitalContentEvent = make(Name.LINK_CLICKING, {
        url: event.target.href,
        source: 'digital_content page' as const
      })
      dispatch(digitalContentEvent)
    },
    recordTagClick: (tag: string) => {
      const digitalContentEvent: DigitalContentEvent = make(Name.TAG_CLICKING, {
        tag,
        source: 'digital_content page' as const
      })
      dispatch(digitalContentEvent)
    },
    record: (event: DigitalContentEvent) => dispatch(event),
    setRepostUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.AGREEMENT,
          id: digitalContentID
        })
      ),
    setFavoriteUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.AGREEMENT,
          id: digitalContentID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true)),
    goToRemixesOfParentPage: (parentDigitalContentId: ID) =>
      dispatch(digitalContentPageActions.goToRemixesOfParentPage(parentDigitalContentId)),
    refetchDigitalContentsLinup: () => dispatch(digitalContentPageActions.refetchLineup())
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(DigitalContentPageProvider)
