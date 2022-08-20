import { ComponentType, PureComponent, RefObject } from 'react'

import {
  ID,
  UID,
  Name,
  FollowSource,
  ShareSource,
  BadgeTier,
  Kind,
  Status,
  makeKindId
} from '@coliving/common'
import { push as pushRoute, replace } from 'connected-react-router'
import { UnregisterCallback } from 'history'
import moment from 'moment'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { getAccountUser } from 'common/store/account/selectors'
import { makeGetLineupMetadatas } from 'common/store/lineup/selectors'
import * as profileActions from 'common/store/pages/profile/actions'
import { feedActions } from 'common/store/pages/profile/lineups/feed/actions'
import { agreementsActions } from 'common/store/pages/profile/lineups/agreements/actions'
import {
  makeGetProfile,
  getProfileFeedLineup,
  getProfileAgreementsLineup,
  getProfileUserId
} from 'common/store/pages/profile/selectors'
import {
  CollectionSortMode,
  Tabs,
  FollowType,
  AgreementsSortMode,
  getTabForRoute
} from 'common/store/pages/profile/types'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialActions from 'common/store/social/users/actions'
import { makeGetRelatedArtists } from 'common/store/ui/artist-recommendations/selectors'
import * as createContentListModalActions from 'common/store/ui/createContentListModal/actions'
import { open } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  OverflowSource,
  OverflowAction
} from 'common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { setFollowers } from 'common/store/user-list/followers/actions'
import { setFollowing } from 'common/store/user-list/following/actions'
import { formatCount } from 'common/utils/formatUtil'
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import { newUserMetadata } from 'schemas'
import { make, AgreementEvent } from 'store/analytics/actions'
import { getIsDone } from 'store/confirmer/selectors'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { getLocationPathname } from 'store/routing/selectors'
import { AppState } from 'store/types'
import { getErrorMessage } from 'utils/error'
import { verifiedHandleWhitelist } from 'utils/handleWhitelist'
import { resizeImage } from 'utils/imageProcessingUtil'
import { getPathname, NOT_FOUND_PAGE, profilePage } from 'utils/route'
import { parseUserRoute } from 'utils/route/userRouteParser'

import { ProfilePageProps as DesktopProfilePageProps } from './components/desktop/ProfilePage'
import { ProfilePageProps as MobileProfilePageProps } from './components/mobile/ProfilePage'

const INITIAL_UPDATE_FIELDS = {
  updatedName: null,
  updatedCoverPhoto: null,
  updatedProfilePicture: null,
  updatedBio: null,
  updatedLocation: null,
  updatedTwitterHandle: null,
  updatedInstagramHandle: null,
  updatedTikTokHandle: null,
  updatedWebsite: null,
  updatedDonation: null
}

type OwnProps = {
  containerRef: RefObject<HTMLDivElement>
  children:
    | ComponentType<MobileProfilePageProps>
    | ComponentType<DesktopProfilePageProps>
}

type ProfilePageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

type ProfilePageState = {
  activeTab: Tabs | null
  editMode: boolean
  shouldMaskContent: boolean
  updatedName: string | null
  updatedCoverPhoto: any | null
  updatedProfilePicture: any | null
  updatedBio: string | null
  updatedLocation: string | null
  updatedTwitterHandle: string | null
  updatedInstagramHandle: string | null
  updatedTikTokHandle: string | null
  updatedWebsite: string | null
  updatedDonation: string | null
  agreementsLineupOrder: AgreementsSortMode
  areArtistRecommendationsVisible: boolean
}

export const MIN_COLLECTIBLES_TIER: BadgeTier = 'silver'

class ProfilePage extends PureComponent<ProfilePageProps, ProfilePageState> {
  static defaultProps = {}

  state: ProfilePageState = {
    activeTab: null,
    editMode: false,
    shouldMaskContent: false,
    agreementsLineupOrder: AgreementsSortMode.RECENT,
    areArtistRecommendationsVisible: false,
    ...INITIAL_UPDATE_FIELDS
  }

  unlisten!: UnregisterCallback

  componentDidMount() {
    // If routing from a previous profile page
    // the lineups must be reset to refetch & update for new user
    this.props.resetProfile()
    this.props.resetArtistAgreements()
    this.props.resetUserFeedAgreements()
    this.fetchProfile(getPathname(this.props.location))

    // Switching from profile page => profile page
    this.unlisten = this.props.history.listen((location, action) => {
      // If changing pages or "POP" on router (with goBack, the pathnames are equal)
      if (
        getPathname(this.props.location) !== getPathname(location) ||
        action === 'POP'
      ) {
        this.props.resetProfile()
        this.props.resetArtistAgreements()
        this.props.resetUserFeedAgreements()
        const params = parseUserRoute(getPathname(location))
        if (params) {
          // Fetch profile if this is a new profile page
          this.fetchProfile(getPathname(location))
        }
        this.setState({
          activeTab: null,
          ...INITIAL_UPDATE_FIELDS
        })
      }
    })
  }

  componentWillUnmount() {
    if (this.unlisten) {
      // Push unlisten to end of event loop. On some browsers, the back button
      // will cause the component to unmount and remove the unlisten faster than
      // the history listener will run. See [AUD-403].
      setImmediate(this.unlisten)
    }
  }

  componentDidUpdate(prevProps: ProfilePageProps, prevState: ProfilePageState) {
    const { pathname, profile, artistAgreements, goToRoute } = this.props
    const { editMode, activeTab } = this.state

    if (profile && profile.status === Status.ERROR) {
      goToRoute(NOT_FOUND_PAGE)
    }

    if (
      !activeTab &&
      profile &&
      profile.profile &&
      artistAgreements.status === Status.SUCCESS
    ) {
      if (profile.profile.agreement_count > 0) {
        this.setState({
          activeTab: Tabs.AGREEMENTS
        })
      } else {
        this.setState({
          activeTab: Tabs.REPOSTS
        })
      }
    } else if (
      !activeTab &&
      profile &&
      profile.profile &&
      !(profile.profile.agreement_count > 0)
    ) {
      this.setState({
        activeTab: Tabs.REPOSTS
      })
    }

    // Replace the URL with the properly formatted /handle route
    if (profile && profile.profile && profile.status === Status.SUCCESS) {
      const params = parseUserRoute(pathname)
      if (params) {
        const { handle } = params
        if (handle === null) {
          const newPath = profilePage(profile.profile.handle)
          this.props.replaceRoute(newPath)
        }
      }
    }

    if (prevProps.profile?.profile?.handle !== profile?.profile?.handle) {
      // If editing profile and route to another user profile, exit edit mode
      if (editMode) this.setState({ editMode: false })
      // Close artist recommendations when the profile changes
      this.setState({ areArtistRecommendationsVisible: false })
    }
  }

  // Check that the sorted order has the _artist_pick agreement as the first
  updateOrderArtistPickCheck = (agreements: Array<{ agreement_id: ID }>) => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return []
    const artistPick = profile._artist_pick
    const artistAgreementIndex = agreements.findIndex(
      (agreement) => agreement.agreement_id === artistPick
    )
    if (artistAgreementIndex > -1) {
      return [agreements[artistAgreementIndex]]
        .concat(agreements.slice(0, artistAgreementIndex))
        .concat(agreements.slice(artistAgreementIndex + 1))
    }
    return agreements
  }

  onFollow = () => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    this.props.onFollow(profile.user_id)
    if (this.props.account) {
      this.props.updateCurrentUserFollows(true)
    }
    if (this.props.relatedArtists && this.props.relatedArtists.length > 0) {
      this.setState({ areArtistRecommendationsVisible: true })
    }
  }

  onUnfollow = () => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    const userId = profile.user_id
    this.props.onUnfollow(userId)
    this.props.setNotificationSubscription(userId, false)

    if (this.props.account) {
      this.props.updateCurrentUserFollows(false)
    }
  }

  onCloseArtistRecommendations = () => {
    this.setState({ areArtistRecommendationsVisible: false })
  }

  fetchProfile = (
    pathname: string,
    forceUpdate = false,
    shouldSetLoading = true,
    deleteExistingEntry = false
  ) => {
    const params = parseUserRoute(pathname)
    if (params) {
      this.props.fetchProfile(
        params.handle,
        params.userId,
        forceUpdate,
        shouldSetLoading,
        deleteExistingEntry
      )
      if (params.tab) {
        this.setState({ activeTab: getTabForRoute(params.tab) })
      }
    } else {
      this.props.goToRoute(NOT_FOUND_PAGE)
    }
  }

  refreshProfile = () => {
    this.fetchProfile(getPathname(this.props.location), true, false, true)
  }

  updateName = (name: string) => {
    this.setState({
      updatedName: name
    })
  }

  updateCoverPhoto = async (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file, 2000, /* square= */ false)
      const url = URL.createObjectURL(file)
      this.setState({
        updatedCoverPhoto: { file, url, source }
      })
    } catch (error) {
      this.setState({
        updatedCoverPhoto: {
          ...(this.state.updatedCoverPhoto || {}),
          error: getErrorMessage(error)
        }
      })
    }
  }

  updateProfilePicture = async (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file)
      const url = URL.createObjectURL(file)
      this.setState({
        updatedProfilePicture: { file, url, source }
      })
    } catch (error) {
      const { updatedProfilePicture } = this.state
      this.setState({
        updatedProfilePicture: {
          ...(updatedProfilePicture && updatedProfilePicture.url
            ? this.state.updatedProfilePicture
            : {}),
          error: getErrorMessage(error)
        }
      })
    }
  }

  updateBio = (bio: string) => {
    this.setState({
      updatedBio: bio
    })
  }

  updateLocation = (location: string) => {
    this.setState({
      updatedLocation: location
    })
  }

  updateTwitterHandle = (handle: string) => {
    this.setState({
      updatedTwitterHandle: handle
    })
  }

  updateInstagramHandle = (handle: string) => {
    this.setState({
      updatedInstagramHandle: handle
    })
  }

  updateTikTokHandle = (handle: string) => {
    this.setState({
      updatedTikTokHandle: handle
    })
  }

  updateWebsite = (website: string) => {
    this.setState({
      updatedWebsite: website
    })
  }

  updateDonation = (donation: string) => {
    this.setState({
      updatedDonation: donation
    })
  }

  changeTab = (tab: Tabs) => {
    this.setState({
      activeTab: tab
    })

    // Once the hero card settles into place, then turn the mask off
    setTimeout(() => {
      const firstTab = this.getIsArtist() ? 'AGREEMENTS' : 'REPOSTS'
      this.setState({
        shouldMaskContent: tab !== firstTab
      })
    }, 300)
  }

  getLineupProps = (lineup: any) => {
    const { currentQueueItem, playing, buffering, containerRef } = this.props
    const { uid: playingUid, agreement, source } = currentQueueItem
    return {
      lineup,
      variant: 'condensed',
      playingSource: source,
      playingAgreementId: agreement ? agreement.agreement_id : null,
      playingUid,
      playing,
      buffering,
      scrollParent: containerRef
    }
  }

  getMode = (isOwner: boolean) => {
    return isOwner ? (this.state.editMode ? 'editing' : 'owner') : 'visitor'
  }

  onEdit = () => {
    this.setState({
      editMode: true,
      updatedName: null,
      updatedCoverPhoto: null,
      updatedProfilePicture: null,
      updatedBio: null,
      updatedLocation: null,
      updatedTwitterHandle: null,
      updatedInstagramHandle: null,
      updatedTikTokHandle: null,
      updatedWebsite: null,
      updatedDonation: null
    })
  }

  onSave = () => {
    const {
      profile: { profile },
      recordUpdateCoverPhoto,
      recordUpdateProfilePicture
    } = this.props
    const {
      updatedCoverPhoto,
      updatedProfilePicture,
      updatedName,
      updatedBio,
      updatedLocation,
      updatedTwitterHandle,
      updatedInstagramHandle,
      updatedTikTokHandle,
      updatedWebsite,
      updatedDonation
    } = this.state

    const updatedMetadata = newUserMetadata({ ...profile })
    if (updatedCoverPhoto && updatedCoverPhoto.file) {
      updatedMetadata.updatedCoverPhoto = updatedCoverPhoto
      recordUpdateCoverPhoto(updatedCoverPhoto.source)
    }
    if (updatedProfilePicture && updatedProfilePicture.file) {
      updatedMetadata.updatedProfilePicture = updatedProfilePicture
      recordUpdateProfilePicture(updatedProfilePicture.source)
    }
    if (updatedName) {
      updatedMetadata.name = updatedName
    }
    if (updatedBio !== null) {
      updatedMetadata.bio = updatedBio
    }
    if (updatedLocation !== null) {
      updatedMetadata.location = updatedLocation
    }
    if (updatedTwitterHandle !== null) {
      updatedMetadata.twitter_handle = updatedTwitterHandle
    }
    if (updatedInstagramHandle !== null) {
      updatedMetadata.instagram_handle = updatedInstagramHandle
    }
    if (updatedTikTokHandle !== null) {
      updatedMetadata.tiktok_handle = updatedTikTokHandle
    }
    if (updatedWebsite !== null) {
      updatedMetadata.website = updatedWebsite
    }
    if (updatedDonation !== null) {
      updatedMetadata.donation = updatedDonation
    }
    this.props.updateProfile(updatedMetadata)
    this.setState({
      editMode: false
    })
  }

  onShare = () => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    this.props.onShare(profile.user_id)
  }

  onCancel = () => {
    this.setState({
      editMode: false,
      updatedName: null,
      updatedCoverPhoto: null,
      updatedProfilePicture: null,
      updatedBio: null,
      updatedLocation: null
    })
  }

  getStats = (isArtist: boolean) => {
    const {
      profile: { profile }
    } = this.props

    let agreementCount = 0
    let content listCount = 0
    let followerCount = 0
    let followingCount = 0

    if (profile) {
      agreementCount = profile.agreement_count
      content listCount = profile.content list_count
      followerCount = profile.follower_count
      followingCount = profile.followee_count
    }

    return isArtist
      ? [
          {
            number: agreementCount,
            title: agreementCount === 1 ? 'agreement' : 'agreements',
            key: 'agreement'
          },
          {
            number: followerCount,
            title: followerCount === 1 ? 'follower' : 'followers',
            key: 'follower'
          },
          { number: followingCount, title: 'following', key: 'following' }
        ]
      : [
          {
            number: content listCount,
            title: content listCount === 1 ? 'content list' : 'content lists',
            key: 'content list'
          },
          {
            number: followerCount,
            title: followerCount === 1 ? 'follower' : 'followers',
            key: 'follower'
          },
          { number: followingCount, title: 'following', key: 'following' }
        ]
  }

  onSortByRecent = () => {
    const {
      artistAgreements,
      updateCollectionOrder,
      profile: { profile },
      agreementUpdateSort
    } = this.props
    if (!profile) return
    this.setState({ agreementsLineupOrder: AgreementsSortMode.RECENT })
    updateCollectionOrder(CollectionSortMode.TIMESTAMP)
    agreementUpdateSort('recent')
    this.props.loadMoreArtistAgreements(
      0,
      artistAgreements.entries.length,
      profile.user_id,
      AgreementsSortMode.RECENT
    )
  }

  onSortByPopular = () => {
    const {
      artistAgreements,
      updateCollectionOrder,
      profile: { profile },
      agreementUpdateSort
    } = this.props
    if (!profile) return
    this.setState({ agreementsLineupOrder: AgreementsSortMode.POPULAR })
    this.props.loadMoreArtistAgreements(
      0,
      artistAgreements.entries.length,
      profile.user_id,
      AgreementsSortMode.POPULAR
    )
    updateCollectionOrder(CollectionSortMode.SAVE_COUNT)
    agreementUpdateSort('popular')
  }

  loadMoreArtistAgreements = (offset: number, limit: number) => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    this.props.loadMoreArtistAgreements(
      offset,
      limit,
      profile.user_id,
      this.state.agreementsLineupOrder
    )
  }

  didChangeTabsFrom = (prevLabel: string, currLabel: string) => {
    const {
      didChangeTabsFrom,
      profile: { profile }
    } = this.props
    if (profile) {
      let tab = `/${currLabel.toLowerCase()}`
      if (profile.agreement_count > 0) {
        // An artist, default route is agreements
        if (currLabel === Tabs.AGREEMENTS) {
          tab = ''
        }
      } else {
        // A normal user, default route is reposts
        if (currLabel === Tabs.REPOSTS) {
          tab = ''
        }
      }
      window.history.replaceState(
        {},
        '', // title -- unused, overriden by helmet
        `/${profile.handle}${tab}`
      )
    }
    didChangeTabsFrom(prevLabel, currLabel)
    this.setState({ activeTab: currLabel as Tabs })
  }

  loadMoreUserFeed = (offset: number, limit: number) => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    this.props.loadMoreUserFeed(offset, limit, profile.user_id)
  }

  formatCardSecondaryText = (
    saves: number,
    agreements: number,
    isPrivate = false
  ) => {
    const savesText = saves === 1 ? 'Favorite' : 'Favorites'
    const agreementsText = agreements === 1 ? 'Agreement' : 'Agreements'
    if (isPrivate) return `Private • ${agreements} ${agreementsText}`
    return `${formatCount(saves)} ${savesText} • ${agreements} ${agreementsText}`
  }

  fetchFollowers = () => {
    const {
      fetchFollowUsers,
      profile: { profile }
    } = this.props
    const followers = profile ? profile.followers.users : []
    if (
      !profile ||
      profile.followers.status === Status.LOADING ||
      profile.follower_count === followers.length
    )
      return
    fetchFollowUsers(FollowType.FOLLOWERS, 22, followers.length)
  }

  fetchFollowees = () => {
    const {
      fetchFollowUsers,
      profile: { profile }
    } = this.props
    const followees = profile ? profile.followees.users : []
    if (
      !profile ||
      profile.followees.status === Status.LOADING ||
      profile.followee_count === followees.length
    )
      return
    fetchFollowUsers(FollowType.FOLLOWEES, 22, followees.length)
  }

  getIsArtist = () => {
    const { profile } = this.props.profile
    return !!profile && profile.agreement_count > 0
  }

  getIsOwner = () => {
    const {
      profile: { profile },
      account
    } = this.props
    return profile && account ? profile.user_id === account.user_id : false
  }

  render() {
    const {
      profile: {
        profile,
        status: profileLoadingStatus,
        albums,
        content lists,
        mostUsedTags,
        isSubscribed
      },
      // Agreements
      artistAgreements,
      playArtistAgreement,
      pauseArtistAgreement,
      // Feed
      userFeed,
      playUserFeedAgreement,
      pauseUserFeedAgreement,
      account,
      goToRoute,
      openCreateContentListModal,
      currentQueueItem,
      setNotificationSubscription,
      setFollowingUserId,
      setFollowersUserId
    } = this.props
    const {
      activeTab,
      editMode,
      shouldMaskContent,
      areArtistRecommendationsVisible,
      updatedName,
      updatedBio,
      updatedLocation,
      updatedCoverPhoto,
      updatedProfilePicture,
      updatedTwitterHandle,
      updatedInstagramHandle,
      updatedTikTokHandle,
      updatedWebsite,
      updatedDonation
    } = this.state

    const accountUserId = account ? account.user_id : null
    const isArtist = this.getIsArtist()
    const isOwner = this.getIsOwner()
    const mode = this.getMode(isOwner)
    const stats = this.getStats(isArtist)

    const userId = profile ? profile.user_id : null
    const handle = profile ? `@${profile.handle}` : ''
    const verified = profile ? profile.is_verified : false
    const twitterVerified = profile ? profile.twitterVerified : false
    const instagramVerified = profile ? profile.instagramVerified : false
    const created = profile
      ? moment(profile.created_at).format('YYYY')
      : moment().format('YYYY')

    const name = profile ? updatedName || profile.name || '' : ''
    const bio = profile
      ? updatedBio !== null
        ? updatedBio
        : profile.bio || ''
      : ''
    const location = profile
      ? updatedLocation !== null
        ? updatedLocation
        : profile.location || ''
      : ''
    const twitterHandle = profile
      ? updatedTwitterHandle !== null
        ? updatedTwitterHandle
        : profile.twitterVerified && !verifiedHandleWhitelist.has(handle)
        ? profile.handle
        : profile.twitter_handle || ''
      : ''
    const instagramHandle = profile
      ? updatedInstagramHandle !== null
        ? updatedInstagramHandle
        : profile.instagramVerified
        ? profile.handle
        : profile.instagram_handle || ''
      : ''
    const tikTokHandle = profile
      ? updatedTikTokHandle !== null
        ? updatedTikTokHandle
        : profile.tiktok_handle || ''
      : ''
    const website = profile
      ? updatedWebsite !== null
        ? updatedWebsite
        : profile.website || ''
      : ''
    const donation = profile
      ? updatedDonation !== null
        ? updatedDonation
        : profile.donation || ''
      : ''
    const profilePictureSizes = profile ? profile._profile_picture_sizes : null
    const coverPhotoSizes = profile ? profile._cover_photo_sizes : null
    const hasProfilePicture = profile
      ? !!profile.profile_picture ||
        !!profile.profile_picture_sizes ||
        updatedProfilePicture
      : false

    const followers = profile ? profile.followers.users : []
    const followersLoading = profile
      ? profile.followers.status === Status.LOADING
      : false
    const followees = profile ? profile.followees.users : []

    const dropdownDisabled =
      activeTab === Tabs.REPOSTS || activeTab === Tabs.COLLECTIBLES
    const following = !!profile && profile.does_current_user_follow

    const childProps = {
      // Computed
      accountUserId,
      userId,
      isArtist,
      isOwner,
      handle,
      verified,
      created,
      name,
      bio,
      location,
      twitterHandle,
      instagramHandle,
      tikTokHandle,
      website,
      donation,
      coverPhotoSizes,
      profilePictureSizes,
      hasProfilePicture,
      followers,
      followersLoading,
      following,
      mode,
      stats,
      activeTab,
      mostUsedTags,
      twitterVerified,
      instagramVerified,

      profile,
      status: profileLoadingStatus,
      albums,
      content lists,
      artistAgreements,
      playArtistAgreement,
      pauseArtistAgreement,
      goToRoute,

      // Methods
      changeTab: this.changeTab,
      getLineupProps: this.getLineupProps,
      onSortByRecent: this.onSortByRecent,
      onSortByPopular: this.onSortByPopular,
      loadMoreArtistAgreements: this.loadMoreArtistAgreements,
      loadMoreUserFeed: this.loadMoreUserFeed,
      formatCardSecondaryText: this.formatCardSecondaryText,
      refreshProfile: this.refreshProfile,
      fetchFollowers: this.fetchFollowers,
      fetchFollowees: this.fetchFollowees,
      setFollowingUserId,
      setFollowersUserId,
      onFollow: this.onFollow,
      onUnfollow: this.onUnfollow,
      onShare: this.onShare,
      onEdit: this.onEdit,
      onSave: this.onSave,
      onCancel: this.onCancel,
      updateProfilePicture: this.updateProfilePicture,
      updateName: this.updateName,
      updateBio: this.updateBio,
      updateLocation: this.updateLocation,
      updateTwitterHandle: this.updateTwitterHandle,
      updateInstagramHandle: this.updateInstagramHandle,
      updateTikTokHandle: this.updateTikTokHandle,
      updateWebsite: this.updateWebsite,
      updateDonation: this.updateDonation,
      updateCoverPhoto: this.updateCoverPhoto,
      didChangeTabsFrom: this.didChangeTabsFrom
    }

    const mobileProps = {
      agreementIsActive: !!currentQueueItem,
      onConfirmUnfollow: this.props.onConfirmUnfollow,
      isUserConfirming: this.props.isUserConfirming,
      hasMadeEdit:
        updatedName !== null ||
        updatedBio !== null ||
        updatedLocation !== null ||
        updatedTwitterHandle !== null ||
        updatedInstagramHandle !== null ||
        updatedTikTokHandle !== null ||
        updatedWebsite !== null ||
        updatedDonation !== null ||
        updatedCoverPhoto !== null ||
        updatedProfilePicture !== null,
      onClickMobileOverflow: this.props.clickOverflow
    }

    const desktopProps = {
      editMode,
      shouldMaskContent,

      areArtistRecommendationsVisible,
      onCloseArtistRecommendations: this.onCloseArtistRecommendations,
      setNotificationSubscription,
      isSubscribed: !!isSubscribed,

      userFeed,
      playUserFeedAgreement,
      pauseUserFeedAgreement,

      followees,
      dropdownDisabled,
      updatedCoverPhoto,
      updatedProfilePicture,

      openCreateContentListModal,

      updateProfile: this.props.updateProfile
    }

    return (
      <this.props.children
        key={getPathname(this.props.location)}
        {...childProps}
        {...mobileProps}
        {...desktopProps}
      />
    )
  }
}

function makeMapStateToProps() {
  const getArtistAgreementsMetadatas = makeGetLineupMetadatas(
    getProfileAgreementsLineup
  )
  const getUserFeedMetadatas = makeGetLineupMetadatas(getProfileFeedLineup)
  const getProfile = makeGetProfile()
  const getCurrentQueueItem = makeGetCurrent()
  const getRelatedArtists = makeGetRelatedArtists()
  const mapStateToProps = (state: AppState) => ({
    account: getAccountUser(state),
    profile: getProfile(state),
    artistAgreements: getArtistAgreementsMetadatas(state),
    userFeed: getUserFeedMetadatas(state),
    currentQueueItem: getCurrentQueueItem(state),
    playing: getPlaying(state),
    buffering: getBuffering(state),
    pathname: getLocationPathname(state),
    isUserConfirming: !getIsDone(state, {
      uid: makeKindId(Kind.USERS, getAccountUser(state)?.user_id)
    }),
    relatedArtists: getRelatedArtists(state, { id: getProfileUserId(state) })
  })
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchProfile: (
      handle: string | null,
      userId: ID | null,
      forceUpdate: boolean,
      shouldSetLoading: boolean,
      deleteExistingEntry: boolean
    ) =>
      dispatch(
        profileActions.fetchProfile(
          handle,
          userId,
          forceUpdate,
          shouldSetLoading,
          deleteExistingEntry
        )
      ),
    updateProfile: (metadata: any) =>
      dispatch(profileActions.updateProfile(metadata)),
    resetProfile: () => dispatch(profileActions.resetProfile()),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    replaceRoute: (route: string) => dispatch(replace(route)),
    updateCollectionOrder: (mode: CollectionSortMode) =>
      dispatch(profileActions.updateCollectionSortMode(mode)),
    onFollow: (userId: ID) =>
      dispatch(socialActions.followUser(userId, FollowSource.PROFILE_PAGE)),
    onUnfollow: (userId: ID) =>
      dispatch(socialActions.unfollowUser(userId, FollowSource.PROFILE_PAGE)),
    onShare: (userId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: userId,
          source: ShareSource.PAGE
        })
      ),
    onConfirmUnfollow: (userId: ID) =>
      dispatch(unfollowConfirmationActions.setOpen(userId)),
    updateCurrentUserFollows: (follow: any) =>
      dispatch(profileActions.updateCurrentUserFollows(follow)),

    // Artist Agreements
    loadMoreArtistAgreements: (
      offset: number,
      limit: number,
      id: ID,
      sort: AgreementsSortMode
    ) => {
      dispatch(
        agreementsActions.fetchLineupMetadatas(offset, limit, false, {
          userId: id,
          sort
        })
      )
    },
    resetArtistAgreements: () => dispatch(agreementsActions.reset()),
    playArtistAgreement: (uid: string) => dispatch(agreementsActions.play(uid)),
    pauseArtistAgreement: () => dispatch(agreementsActions.pause()),
    // User Feed
    loadMoreUserFeed: (offset: number, limit: number, id: ID) =>
      dispatch(
        feedActions.fetchLineupMetadatas(offset, limit, false, { userId: id })
      ),
    resetUserFeedAgreements: () => dispatch(feedActions.reset()),
    playUserFeedAgreement: (uid: UID) => dispatch(feedActions.play(uid)),
    pauseUserFeedAgreement: () => dispatch(feedActions.pause()),
    // Followes
    fetchFollowUsers: (followGroup: any, limit: number, offset: number) =>
      dispatch(profileActions.fetchFollowUsers(followGroup, limit, offset)),

    openCreateContentListModal: () =>
      dispatch(createContentListModalActions.open(undefined, true)),
    setNotificationSubscription: (userId: ID, isSubscribed: boolean) =>
      dispatch(
        profileActions.setNotificationSubscription(userId, isSubscribed, true)
      ),

    setFollowingUserId: (userId: ID) => dispatch(setFollowing(userId)),
    setFollowersUserId: (userId: ID) => dispatch(setFollowers(userId)),

    clickOverflow: (userId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.PROFILE, id: userId, overflowActions })
      ),

    didChangeTabsFrom: (prevLabel: string, currLabel: string) => {
      if (prevLabel !== currLabel) {
        const agreementEvent: AgreementEvent = make(Name.PROFILE_PAGE_TAB_CLICK, {
          tab: currLabel.toLowerCase() as
            | 'agreements'
            | 'albums'
            | 'reposts'
            | 'content lists'
            | 'collectibles'
        })
        dispatch(agreementEvent)
      }
    },
    agreementUpdateSort: (sort: 'recent' | 'popular') => {
      const agreementEvent: AgreementEvent = make(Name.PROFILE_PAGE_SORT, { sort })
      dispatch(agreementEvent)
    },
    recordUpdateProfilePicture: (source: 'original' | 'unsplash' | 'url') => {
      const agreementEvent: AgreementEvent = make(
        Name.ACCOUNT_HEALTH_UPLOAD_PROFILE_PICTURE,
        { source }
      )
      dispatch(agreementEvent)
    },
    recordUpdateCoverPhoto: (source: 'original' | 'unsplash' | 'url') => {
      const agreementEvent: AgreementEvent = make(
        Name.ACCOUNT_HEALTH_UPLOAD_COVER_PHOTO,
        { source }
      )
      dispatch(agreementEvent)
    }
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(ProfilePage)
)
