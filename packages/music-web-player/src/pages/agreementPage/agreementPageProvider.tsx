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
import * as cacheAgreementActions from 'common/store/cache/agreements/actions'
import { makeGetLineupMetadatas } from 'common/store/lineup/selectors'
import * as agreementPageActions from 'common/store/pages/digital_content/actions'
import { agreementsActions } from 'common/store/pages/digital_content/lineup/actions'
import {
  getUser,
  getLineup,
  getAgreementRank,
  getAgreement,
  getRemixParentAgreement,
  getStatus,
  getSourceSelector,
  getAgreementPermalink
} from 'common/store/pages/digital_content/selectors'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialAgreementsActions from 'common/store/social/agreements/actions'
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
import { AgreementEvent, make } from 'store/analytics/actions'
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
  fullAgreementPage,
  agreementRemixesPage
} from 'utils/route'
import { parseAgreementRoute, AgreementRouteParams } from 'utils/route/agreementRouteParser'
import { getAgreementPageTitle, getAgreementPageDescription } from 'utils/seo'

import StemsSEOHint from './components/stemsSEOHint'
import { OwnProps as DesktopAgreementPageProps } from './components/desktop/agreementPage'
import { OwnProps as MobileAgreementPageProps } from './components/mobile/agreementPage'
import { TRENDING_BADGE_LIMIT } from './store/sagas'

const getRemixParentAgreementId = (digital_content: DigitalContent | null) =>
  digital_content?.remix_of?.agreements?.[0]?.parent_digital_content_id

type OwnProps = {
  children:
    | ComponentType<MobileAgreementPageProps>
    | ComponentType<DesktopAgreementPageProps>
}

type mapStateProps = ReturnType<typeof makeMapStateToProps>
type AgreementPageProviderProps = OwnProps &
  ReturnType<mapStateProps> &
  ReturnType<typeof mapDispatchToProps>

type AgreementPageProviderState = {
  pathname: string
  ownerHandle: string | null
  showDeleteConfirmation: boolean
  routeKey: ID
  source: string | undefined
}

class AgreementPageProvider extends Component<
  AgreementPageProviderProps,
  AgreementPageProviderState
> {
  state: AgreementPageProviderState = {
    pathname: this.props.pathname,
    ownerHandle: null,
    showDeleteConfirmation: false,
    routeKey: parseAgreementRoute(this.props.pathname)?.agreementId ?? 0,
    source: undefined
  }

  componentDidMount() {
    const params = parseAgreementRoute(this.props.pathname)
    // Go to 404 if the digital_content id isn't parsed correctly or if should redirect
    if (!params || (params.agreementId && shouldRedirectAgreement(params.agreementId))) {
      this.props.goToRoute(NOT_FOUND_PAGE)
      return
    }

    this.fetchAgreements(params)
  }

  componentDidUpdate(prevProps: AgreementPageProviderProps) {
    const {
      pathname,
      digital_content,
      status,
      refetchAgreementsLinup,
      user,
      agreementPermalink
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
        const params = parseAgreementRoute(pathname)
        if (params) {
          this.setState({ pathname })
          this.fetchAgreements(params)
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
      getRemixParentAgreementId(prevProps.digital_content) !== getRemixParentAgreementId(digital_content)
    ) {
      refetchAgreementsLinup()
    }

    if (digital_content) {
      const params = parseAgreementRoute(pathname)
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
            agreementPermalink &&
            agreementPermalink !== pathname
          ) {
            // The path is going to change but don't re-fetch as we already have the digital_content
            this.setState({ pathname: agreementPermalink })
            this.props.replaceRoute(agreementPermalink)
          }
        }
      }
    }
  }

  componentWillUnmount() {
    if (!isMobile()) {
      // Don't reset on mobile because there are two
      // digital_content pages mounted at a time due to animations.
      this.props.resetAgreementPage()
    }
  }

  fetchAgreements = (params: NonNullable<AgreementRouteParams>) => {
    const { digital_content } = this.props
    const { slug, agreementId, handle } = params

    // Go to feed if the digital_content is deleted
    if (digital_content && digital_content.digital_content_id === agreementId) {
      if (digital_content._marked_deleted) {
        this.props.goToRoute(FEED_PAGE)
        return
      }
    }
    this.props.reset()
    if (agreementId) {
      this.props.setAgreementId(agreementId)
    }
    if (slug && handle) {
      this.props.setAgreementPermalink(`/${handle}/${slug}`)
    }
    this.props.fetchAgreement(agreementId, slug || '', handle || '', !!(slug && handle))
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

  onMoreByLandlordAgreementsPlay = (uid?: string) => {
    const { play, recordPlayMoreByLandlord } = this.props
    play(uid)
    if (uid) {
      const agreementId = Uid.fromString(uid).id
      recordPlayMoreByLandlord(agreementId)
    }
  }

  onHeroRepost = (isReposted: boolean, agreementId: ID) => {
    const { repostAgreement, undoRepostAgreement } = this.props
    if (!isReposted) {
      repostAgreement(agreementId)
    } else {
      undoRepostAgreement(agreementId)
    }
  }

  onHeroShare = (agreementId: ID) => {
    const { shareAgreement } = this.props
    shareAgreement(agreementId)
  }

  onSaveAgreement = (isSaved: boolean, agreementId: ID) => {
    const { saveAgreement, unsaveAgreement } = this.props
    if (isSaved) {
      unsaveAgreement(agreementId)
    } else {
      saveAgreement(agreementId)
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
    const parentAgreementId = getRemixParentAgreementId(digital_content)
    if (parentAgreementId) {
      goToRemixesOfParentPage(parentAgreementId)
    }
  }

  goToAllRemixesPage = () => {
    const { digital_content } = this.props
    if (digital_content) {
      this.props.goToRoute(agreementRemixesPage(digital_content.permalink))
    }
  }

  goToFavoritesPage = (agreementId: ID) => {
    this.props.setFavoriteAgreementId(agreementId)
    this.props.goToRoute(FAVORITING_USERS_ROUTE)
  }

  goToRepostsPage = (agreementId: ID) => {
    this.props.setRepostAgreementId(agreementId)
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
      remixParentAgreement,
      user,
      agreementRank,
      moreByLandlord,
      currentQueueItem,
      playing,
      buffering,
      userId,
      pause,
      downloadAgreement,
      onExternalLinkClick
    } = this.props
    const heroPlaying =
      playing &&
      !!digital_content &&
      !!currentQueueItem.digital_content &&
      currentQueueItem.digital_content.digital_content_id === digital_content.digital_content_id
    const badge =
      agreementRank.year && agreementRank.year <= TRENDING_BADGE_LIMIT
        ? `#${agreementRank.year} This Year`
        : agreementRank.month && agreementRank.month <= TRENDING_BADGE_LIMIT
        ? `#${agreementRank.month} This Month`
        : agreementRank.week && agreementRank.week <= TRENDING_BADGE_LIMIT
        ? `#${agreementRank.week} This Week`
        : null

    const desktopProps = {
      // Follow Props
      onFollow: this.onFollow,
      onUnfollow: this.onUnfollow,
      makePublic: this.props.makeAgreementPublic,
      onClickReposts: this.onClickReposts,
      onClickFavorites: this.onClickFavorites
    }

    const title = getAgreementPageTitle({
      title: digital_content ? digital_content.title : '',
      handle: user ? user.handle : ''
    })

    const releaseDate = digital_content ? digital_content.release_date || digital_content.created_at : ''
    const description = getAgreementPageDescription({
      releaseDate: releaseDate ? formatDate(releaseDate) : '',
      description: digital_content?.description ?? '',
      mood: digital_content?.mood ?? '',
      genre: digital_content ? getCanonicalName(digital_content.genre) : '',
      duration: digital_content ? formatSeconds(digital_content.duration) : '',
      tags: digital_content ? (digital_content.tags || '').split(',').filter(Boolean) : []
    })
    const canonicalUrl = user && digital_content ? fullAgreementPage(digital_content.permalink) : ''

    // If the digital_content has a remix parent and it's not deleted and the original's owner is not deactivated.
    const hasValidRemixParent =
      !!getRemixParentAgreementId(digital_content) &&
      !!remixParentAgreement &&
      remixParentAgreement.is_delete === false &&
      !remixParentAgreement.user?.is_deactivated

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
      heroAgreement: digital_content,
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
      onSaveAgreement: this.onSaveAgreement,
      onDownloadAgreement: downloadAgreement,
      onClickMobileOverflow: this.props.clickOverflow,
      onConfirmUnfollow: this.props.onConfirmUnfollow,
      goToFavoritesPage: this.goToFavoritesPage,
      goToRepostsPage: this.goToRepostsPage,

      // Agreements Lineup Props
      agreements: moreByLandlord,
      currentQueueItem,
      isPlaying: playing,
      isBuffering: buffering,
      play: this.onMoreByLandlordAgreementsPlay,
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
const shouldRedirectAgreement = (agreementId: ID) =>
  agreementId >= REDIRECT_AGREEMENT_ID_RANGE[0] && agreementId <= REDIRECT_AGREEMENT_ID_RANGE[1]

function makeMapStateToProps() {
  const getMoreByLandlordLineup = makeGetLineupMetadatas(getLineup)
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    return {
      source: getSourceSelector(state),
      digital_content: getAgreement(state),
      agreementPermalink: getAgreementPermalink(state),
      remixParentAgreement: getRemixParentAgreement(state),
      user: getUser(state),
      status: getStatus(state),
      moreByLandlord: getMoreByLandlordLineup(state),
      userId: getUserId(state),

      currentQueueItem: getCurrentQueueItem(state),
      playing: getPlaying(state),
      buffering: getBuffering(state),
      agreementRank: getAgreementRank(state),
      isMobile: isMobile(),
      pathname: getLocationPathname(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchAgreement: (
      agreementId: number | null,
      slug: string,
      ownerHandle: string,
      canBeUnlisted: boolean
    ) =>
      dispatch(
        agreementPageActions.fetchAgreement(agreementId, slug, ownerHandle, canBeUnlisted)
      ),
    setAgreementId: (agreementId: number) =>
      dispatch(agreementPageActions.setAgreementId(agreementId)),
    setAgreementPermalink: (permalink: string) =>
      dispatch(agreementPageActions.setAgreementPermalink(permalink)),
    resetAgreementPage: () => dispatch(agreementPageActions.resetAgreementPage()),
    makeAgreementPublic: (agreementId: ID) =>
      dispatch(agreementPageActions.makeAgreementPublic(agreementId)),

    goToRoute: (route: string) => dispatch(pushRoute(route)),
    replaceRoute: (route: string) => dispatch(replace(route)),
    reset: (source?: string) => dispatch(agreementsActions.reset(source)),
    play: (uid?: string) => dispatch(agreementsActions.play(uid)),
    recordPlayMoreByLandlord: (agreementId: ID) => {
      const agreementEvent: AgreementEvent = make(Name.AGREEMENT_PAGE_PLAY_MORE, {
        id: agreementId
      })
      dispatch(agreementEvent)
    },
    pause: () => dispatch(agreementsActions.pause()),
    shareAgreement: (agreementId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'digital_content',
          agreementId,
          source: ShareSource.PAGE
        })
      ),
    saveAgreement: (agreementId: ID) =>
      dispatch(
        socialAgreementsActions.saveAgreement(agreementId, FavoriteSource.AGREEMENT_PAGE)
      ),
    unsaveAgreement: (agreementId: ID) =>
      dispatch(
        socialAgreementsActions.unsaveAgreement(agreementId, FavoriteSource.AGREEMENT_PAGE)
      ),
    deleteAgreement: (agreementId: ID) =>
      dispatch(cacheAgreementActions.deleteAgreement(agreementId)),
    repostAgreement: (agreementId: ID) =>
      dispatch(
        socialAgreementsActions.repostAgreement(agreementId, RepostSource.AGREEMENT_PAGE)
      ),
    undoRepostAgreement: (agreementId: ID) =>
      dispatch(
        socialAgreementsActions.undoRepostAgreement(agreementId, RepostSource.AGREEMENT_PAGE)
      ),
    editAgreement: (agreementId: ID, formFields: any) =>
      dispatch(cacheAgreementActions.editAgreement(agreementId, formFields)),
    onFollow: (userId: ID) =>
      dispatch(socialUsersActions.followUser(userId, FollowSource.AGREEMENT_PAGE)),
    onUnfollow: (userId: ID) =>
      dispatch(
        socialUsersActions.unfollowUser(userId, FollowSource.AGREEMENT_PAGE)
      ),
    onConfirmUnfollow: (userId: ID) =>
      dispatch(unfollowConfirmationActions.setOpen(userId)),
    downloadAgreement: (
      agreementId: ID,
      cid: CID,
      contentNodeEndpoints: string,
      category?: string,
      parentAgreementId?: ID
    ) => {
      dispatch(
        socialAgreementsActions.downloadAgreement(
          agreementId,
          cid,
          contentNodeEndpoints,
          category
        )
      )
      const agreementEvent: AgreementEvent = make(Name.AGREEMENT_PAGE_DOWNLOAD, {
        id: agreementId,
        category,
        parent_digital_content_id: parentAgreementId
      })
      dispatch(agreementEvent)
    },
    clickOverflow: (agreementId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.AGREEMENTS, id: agreementId, overflowActions })
      ),
    setRepostAgreementId: (agreementId: ID) =>
      dispatch(setRepost(agreementId, RepostType.AGREEMENT)),
    setFavoriteAgreementId: (agreementId: ID) =>
      dispatch(setFavorite(agreementId, FavoriteType.AGREEMENT)),
    onExternalLinkClick: (event: any) => {
      const agreementEvent: AgreementEvent = make(Name.LINK_CLICKING, {
        url: event.target.href,
        source: 'digital_content page' as const
      })
      dispatch(agreementEvent)
    },
    recordTagClick: (tag: string) => {
      const agreementEvent: AgreementEvent = make(Name.TAG_CLICKING, {
        tag,
        source: 'digital_content page' as const
      })
      dispatch(agreementEvent)
    },
    record: (event: AgreementEvent) => dispatch(event),
    setRepostUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.AGREEMENT,
          id: agreementID
        })
      ),
    setFavoriteUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.AGREEMENT,
          id: agreementID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true)),
    goToRemixesOfParentPage: (parentAgreementId: ID) =>
      dispatch(agreementPageActions.goToRemixesOfParentPage(parentAgreementId)),
    refetchAgreementsLinup: () => dispatch(agreementPageActions.refetchLineup())
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(AgreementPageProvider)
