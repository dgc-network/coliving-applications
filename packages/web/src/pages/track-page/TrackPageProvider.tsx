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
  Agreement,
  Uid
} from '@coliving/common'
import { push as pushRoute, replace } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getUserId } from 'common/store/account/selectors'
import * as cacheAgreementActions from 'common/store/cache/agreements/actions'
import { makeGetLineupMetadatas } from 'common/store/lineup/selectors'
import * as agreementPageActions from 'common/store/pages/agreement/actions'
import { agreementsActions } from 'common/store/pages/agreement/lineup/actions'
import {
  getUser,
  getLineup,
  getAgreementRank,
  getAgreement,
  getRemixParentAgreement,
  getStatus,
  getSourceSelector,
  getAgreementPermalink
} from 'common/store/pages/agreement/selectors'
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
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import DeletedPage from 'pages/deleted-page/DeletedPage'
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

import StemsSEOHint from './components/StemsSEOHint'
import { OwnProps as DesktopAgreementPageProps } from './components/desktop/AgreementPage'
import { OwnProps as MobileAgreementPageProps } from './components/mobile/AgreementPage'
import { TRENDING_BADGE_LIMIT } from './store/sagas'

const getRemixParentAgreementId = (agreement: Agreement | null) =>
  agreement?.remix_of?.agreements?.[0]?.parent_agreement_id

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
    // Go to 404 if the agreement id isn't parsed correctly or if should redirect
    if (!params || (params.agreementId && shouldRedirectAgreement(params.agreementId))) {
      this.props.goToRoute(NOT_FOUND_PAGE)
      return
    }

    this.fetchAgreements(params)
  }

  componentDidUpdate(prevProps: AgreementPageProviderProps) {
    const {
      pathname,
      agreement,
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
      // On componentDidUpdate we try to reparse the URL because if you’re on a agreement page
      // and go to another agreement page, the component doesn’t remount but we need to
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
      this.state.routeKey === this.props.agreement?.agreement_id
    ) {
      this.setState({ source: this.props.source })
    }

    // If the remix of this agreement changed and we have
    // already fetched the agreement, refetch the entire lineup
    // because the remix parent agreement needs to be retrieved
    if (
      prevProps.agreement &&
      prevProps.agreement.agreement_id &&
      agreement &&
      agreement.agreement_id &&
      getRemixParentAgreementId(prevProps.agreement) !== getRemixParentAgreementId(agreement)
    ) {
      refetchAgreementsLinup()
    }

    if (agreement) {
      const params = parseAgreementRoute(pathname)
      if (params) {
        // Check if we are coming from a non-canonical route and replace route if necessary.
        const { slug, handle } = params
        if (slug === null || handle === null) {
          if (agreement.permalink) {
            this.props.replaceRoute(agreement.permalink)
          }
        } else {
          // Reroute to the most recent permalink if necessary in case user edits the agreement
          // name, which changes the permalink
          if (
            pathname === this.state.pathname &&
            prevProps.agreement?.agreement_id === agreement?.agreement_id &&
            agreementPermalink &&
            agreementPermalink !== pathname
          ) {
            // The path is going to change but don't re-fetch as we already have the agreement
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
      // agreement pages mounted at a time due to animations.
      this.props.resetAgreementPage()
    }
  }

  fetchAgreements = (params: NonNullable<AgreementRouteParams>) => {
    const { agreement } = this.props
    const { slug, agreementId, handle } = params

    // Go to feed if the agreement is deleted
    if (agreement && agreement.agreement_id === agreementId) {
      if (agreement._marked_deleted) {
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
    const agreement = entries[0]

    if (heroPlaying) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${agreement.id}`,
          source: PlaybackSource.AGREEMENT_PAGE
        })
      )
    } else if (
      currentQueueItem.uid !== agreement.uid &&
      currentQueueItem.agreement &&
      currentQueueItem.agreement.agreement_id === agreement.id
    ) {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${agreement.id}`,
          source: PlaybackSource.AGREEMENT_PAGE
        })
      )
    } else if (agreement) {
      play(agreement.uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${agreement.id}`,
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
    const { onFollow, agreement } = this.props
    if (agreement) onFollow(agreement.owner_id)
  }

  onUnfollow = () => {
    const { onUnfollow, onConfirmUnfollow, agreement } = this.props
    if (agreement) {
      if (this.props.isMobile) {
        onConfirmUnfollow(agreement.owner_id)
      } else {
        onUnfollow(agreement.owner_id)
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
    const { goToRemixesOfParentPage, agreement } = this.props
    const parentAgreementId = getRemixParentAgreementId(agreement)
    if (parentAgreementId) {
      goToRemixesOfParentPage(parentAgreementId)
    }
  }

  goToAllRemixesPage = () => {
    const { agreement } = this.props
    if (agreement) {
      this.props.goToRoute(agreementRemixesPage(agreement.permalink))
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
    this.props.agreement && this.props.setRepostUsers(this.props.agreement.agreement_id)
    this.props.setModalVisibility()
  }

  onClickFavorites = () => {
    this.props.agreement && this.props.setFavoriteUsers(this.props.agreement.agreement_id)
    this.props.setModalVisibility()
  }

  render() {
    const {
      agreement,
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
      !!agreement &&
      !!currentQueueItem.agreement &&
      currentQueueItem.agreement.agreement_id === agreement.agreement_id
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
      title: agreement ? agreement.title : '',
      handle: user ? user.handle : ''
    })

    const releaseDate = agreement ? agreement.release_date || agreement.created_at : ''
    const description = getAgreementPageDescription({
      releaseDate: releaseDate ? formatDate(releaseDate) : '',
      description: agreement?.description ?? '',
      mood: agreement?.mood ?? '',
      genre: agreement ? getCanonicalName(agreement.genre) : '',
      duration: agreement ? formatSeconds(agreement.duration) : '',
      tags: agreement ? (agreement.tags || '').split(',').filter(Boolean) : []
    })
    const canonicalUrl = user && agreement ? fullAgreementPage(agreement.permalink) : ''

    // If the agreement has a remix parent and it's not deleted and the original's owner is not deactivated.
    const hasValidRemixParent =
      !!getRemixParentAgreementId(agreement) &&
      !!remixParentAgreement &&
      remixParentAgreement.is_delete === false &&
      !remixParentAgreement.user?.is_deactivated

    if ((agreement?.is_delete || agreement?._marked_deleted) && user) {
      // Agreement has not been blocked and is content-available, meaning the owner
      // deleted themselves via transaction.
      const deletedByLandlord = !agreement._blocked && agreement.is_available

      return (
        <DeletedPage
          title={title}
          description={description}
          canonicalUrl={canonicalUrl}
          playable={{ metadata: agreement, type: PlayableType.AGREEMENT }}
          user={user}
          deletedByLandlord={deletedByLandlord}
        />
      )
    }

    const childProps = {
      title,
      description,
      canonicalUrl,
      heroAgreement: agreement,
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
        {!!agreement?._stems?.[0] && <StemsSEOHint />}
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
      agreement: getAgreement(state),
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
          type: 'agreement',
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
        parent_agreement_id: parentAgreementId
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
        source: 'agreement page' as const
      })
      dispatch(agreementEvent)
    },
    recordTagClick: (tag: string) => {
      const agreementEvent: AgreementEvent = make(Name.TAG_CLICKING, {
        tag,
        source: 'agreement page' as const
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
