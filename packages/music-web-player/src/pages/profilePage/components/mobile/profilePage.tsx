import { useEffect, useContext, ReactNode } from 'react'

import {
  ID,
  UID,
  Collection,
  CoverPhotoSizes,
  ProfilePictureSizes,
  LineupState,
  Status,
  User
} from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconAlbum } from 'assets/img/iconAlbum.svg'
import { ReactComponent as IconCollectibles } from 'assets/img/iconCollectibles.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import { ReactComponent as IconContentLists } from 'assets/img/iconContentLists.svg'
import { ReactComponent as IconReposts } from 'assets/img/iconRepost.svg'
import { useSelectTierInfo } from 'common/hooks/wallet'
import { feedActions } from 'common/store/pages/profile/lineups/feed/actions'
import { digitalContentsActions } from 'common/store/pages/profile/lineups/digital_contents/actions'
import { Tabs, ProfileUser } from 'common/store/pages/profile/types'
import { badgeTiers } from 'common/store/wallet/utils'
import Card from 'components/card/mobile/card'
import CollectiblesPage from 'components/collectibles/components/collectiblesPage'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import CardLineup from 'components/lineup/cardLineup'
import Lineup from 'components/lineup/lineup'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import TextElement, { Type } from 'components/nav/mobile/textElement'
import NavContext, {
  LeftPreset,
  CenterPreset
} from 'components/nav/store/context'
import NetworkConnectivityMonitor from 'components/networkConnectivity/networkConnectivityMonitor'
import PullToRefresh from 'components/pullToRefresh/pullToRefresh'
import TierExplainerDrawer from 'components/userBadges/tierExplainerDrawer'
import useAsyncPoll from 'hooks/useAsyncPoll'
import useTabs from 'hooks/useTabs/useTabs'
import { MIN_COLLECTIBLES_TIER } from 'pages/profilePage/profilePageProvider'
import { albumPage, contentListPage, fullProfilePage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import { DeactivatedProfileTombstone } from '../deactivatedProfileTombstone'

import EditProfile from './editProfile'
import ProfileHeader from './profileHeader'
import styles from './profilePage.module.css'
import { ShareUserButton } from './shareUserButton'

export type ProfilePageProps = {
  // Computed
  accountUserId: ID | null
  isLandlord: boolean
  isOwner: boolean
  userId: ID | null
  handle: string
  verified: boolean
  created: string
  name: string
  bio: string
  location: string
  twitterHandle: string
  instagramHandle: string
  tikTokHandle: string
  twitterVerified?: boolean
  instagramVerified?: boolean
  website: string
  donation: string
  coverPhotoSizes: CoverPhotoSizes | null
  profilePictureSizes: ProfilePictureSizes | null
  hasProfilePicture: boolean
  followers: User[]
  followersLoading: boolean
  setFollowingUserId: (userId: ID) => void
  setFollowersUserId: (userId: ID) => void
  activeTab: Tabs | null
  following: boolean
  isSubscribed: boolean
  mode: string
  // Whether or not the user has edited at least one thing on their profile
  hasMadeEdit: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  stats: Array<{ number: number; title: string; key: string }>
  digitalContentIsActive: boolean
  isUserConfirming: boolean

  profile: ProfileUser | null
  albums: Collection[] | null
  contentLists: Collection[] | null
  status: Status
  goToRoute: (route: string) => void
  landlordDigitalContents: LineupState<{ id: ID }>
  userFeed: LineupState<{ id: ID }>
  playLandlordDigitalContent: (uid: UID) => void
  pauseLandlordDigitalContent: () => void
  playUserFeedDigitalContent: (uid: UID) => void
  pauseUserFeedDigitalContent: () => void
  refreshProfile: () => void

  // Updates
  updatedCoverPhoto: { file: File; url: string } | null
  updatedProfilePicture: { file: File; url: string } | null

  // Methods
  changeTab: (tab: Tabs) => void
  getLineupProps: (lineup: any) => any
  loadMoreLandlordDigitalContents: (offset: number, limit: number) => void
  loadMoreUserFeed: (offset: number, limit: number) => void
  formatCardSecondaryText: (
    saves: number,
    digitalContents: number,
    isPrivate?: boolean
  ) => string
  fetchFollowers: () => void
  onFollow: (id: ID) => void
  onConfirmUnfollow: (id: ID) => void
  updateName: (name: string) => void
  updateBio: (bio: string) => void
  updateLocation: (location: string) => void
  updateTwitterHandle: (handle: string) => void
  updateInstagramHandle: (handle: string) => void
  updateTikTokHandle: (handle: string) => void
  updateWebsite: (website: string) => void
  updateDonation: (donation: string) => void
  updateProfilePicture: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => Promise<void>
  updateCoverPhoto: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => Promise<void>
  setNotificationSubscription: (userId: ID, isSubscribed: boolean) => void
  didChangeTabsFrom: (prevLabel: string, currentLabel: string) => void
  areLandlordRecommendationsVisible: boolean
  onCloseLandlordRecommendations: () => void
}

type EmptyTabProps = {
  message: ReactNode
}

export const EmptyTab = (props: EmptyTabProps) => {
  return <div className={styles.emptyTab}>{props.message}</div>
}

const landlordTabs = [
  { icon: <IconNote />, text: 'DigitalContents', label: Tabs.AGREEMENTS },
  { icon: <IconAlbum />, text: 'Albums', label: Tabs.ALBUMS },
  { icon: <IconContentLists />, text: 'ContentLists', label: Tabs.CONTENT_LISTS },
  {
    icon: <IconReposts className={styles.iconReposts} />,
    text: 'Reposts',
    label: Tabs.REPOSTS
  }
]

const userTabs = [
  {
    icon: <IconReposts className={styles.iconReposts} />,
    text: 'Reposts',
    label: Tabs.REPOSTS
  },
  { icon: <IconContentLists />, text: 'ContentLists', label: Tabs.CONTENT_LISTS }
]

const collectiblesTab = {
  icon: <IconCollectibles />,
  text: 'Collectibles',
  label: Tabs.COLLECTIBLES
}

const landlordTabsWithCollectibles = [...landlordTabs, collectiblesTab]
const userTabsWithCollectibles = [...userTabs, collectiblesTab]

const getMessages = ({
  name,
  isOwner
}: {
  name: string
  isOwner: boolean
}) => ({
  emptyDigitalContents: isOwner
    ? "You haven't created any digitalContents yet"
    : `${name} hasn't created any digitalContents yet`,
  emptyAlbums: isOwner
    ? "You haven't created any albums yet"
    : `${name} hasn't created any albums yet`,
  emptyContentLists: isOwner
    ? "You haven't created any contentLists yet"
    : `${name} hasn't created any contentLists yet`,
  emptyReposts: isOwner
    ? "You haven't reposted anything yet"
    : `${name} hasn't reposted anything yet`
})

const g = withNullGuard((props: ProfilePageProps) => {
  const { profile, albums, contentLists } = props
  if (profile && albums && contentLists) {
    return { ...props, profile, albums, contentLists }
  }
})

const ProfilePage = g(
  ({
    accountUserId,
    userId,
    name,
    handle,
    profile,
    bio,
    location,
    status,
    isLandlord,
    isOwner,
    verified,
    coverPhotoSizes,
    profilePictureSizes,
    hasProfilePicture,
    followers,
    twitterHandle,
    instagramHandle,
    tikTokHandle,
    twitterVerified,
    instagramVerified,
    website,
    donation,
    albums,
    contentLists,
    landlordDigitalContents,
    userFeed,
    isUserConfirming,
    getLineupProps,
    loadMoreLandlordDigitalContents,
    loadMoreUserFeed,
    playLandlordDigitalContent,
    pauseLandlordDigitalContent,
    playUserFeedDigitalContent,
    pauseUserFeedDigitalContent,
    formatCardSecondaryText,
    setFollowingUserId,
    setFollowersUserId,
    refreshProfile,
    goToRoute,
    following,
    isSubscribed,
    onFollow,
    onConfirmUnfollow,
    mode,
    hasMadeEdit,
    onEdit,
    onSave,
    onCancel,
    updatedCoverPhoto,
    updatedProfilePicture,
    updateName,
    updateBio,
    updateLocation,
    updateTwitterHandle,
    updateInstagramHandle,
    updateTikTokHandle,
    updateWebsite,
    updateDonation,
    updateProfilePicture,
    updateCoverPhoto,
    setNotificationSubscription,
    didChangeTabsFrom,
    activeTab,
    areLandlordRecommendationsVisible,
    onCloseLandlordRecommendations
  }) => {
    const { setHeader } = useContext(HeaderContext)
    useEffect(() => {
      setHeader(null)
    }, [setHeader])

    const messages = getMessages({ name, isOwner })
    let content
    let profileTabs
    let profileElements
    const isLoading = status === Status.LOADING
    const isEditing = mode === 'editing'

    // Set Nav-Bar Menu
    const { setLeft, setCenter, setRight } = useContext(NavContext)!
    useEffect(() => {
      let leftNav
      let rightNav
      if (isEditing) {
        leftNav = (
          <TextElement text='Cancel' type={Type.SECONDARY} onClick={onCancel} />
        )
        rightNav = (
          <TextElement
            text='Save'
            type={Type.PRIMARY}
            isEnabled={hasMadeEdit}
            onClick={onSave}
          />
        )
      } else {
        leftNav = isOwner ? LeftPreset.SETTINGS : LeftPreset.BACK
        rightNav = <ShareUserButton userId={userId} />
      }
      if (userId) {
        setLeft(leftNav)
        setRight(rightNav)
        setCenter(CenterPreset.LOGO)
      }
    }, [
      setLeft,
      setCenter,
      setRight,
      userId,
      isOwner,
      isEditing,
      onCancel,
      onSave,
      hasMadeEdit
    ])

    const { tierNumber } = useSelectTierInfo(userId ?? 0)
    const profileHasCollectiblesTierRequirement =
      tierNumber >=
      badgeTiers.findIndex((t) => t.tier === MIN_COLLECTIBLES_TIER)

    const profileHasCollectibles =
      profile?.collectibleList?.length || profile?.solanaCollectibleList?.length
    const profileNeverSetCollectiblesOrder = !profile?.collectibles
    const profileHasNonEmptyCollectiblesOrder =
      profile?.collectibles?.order?.length ?? false
    const profileHasVisibleImageOrVideoCollectibles =
      profileHasCollectibles &&
      (profileNeverSetCollectiblesOrder || profileHasNonEmptyCollectiblesOrder)
    const didCollectiblesLoadAndWasEmpty =
      profileHasCollectibles && !profileHasNonEmptyCollectiblesOrder

    const isUserOnTheirProfile = accountUserId === userId

    if (isLoading) {
      content = null
    } else if (isEditing) {
      content = (
        <EditProfile
          name={name}
          bio={bio}
          location={location}
          isVerified={verified}
          twitterHandle={twitterHandle}
          instagramHandle={instagramHandle}
          tikTokHandle={tikTokHandle}
          twitterVerified={twitterVerified}
          instagramVerified={instagramVerified}
          website={website}
          donation={donation}
          onUpdateName={updateName}
          onUpdateBio={updateBio}
          onUpdateLocation={updateLocation}
          onUpdateTwitterHandle={updateTwitterHandle}
          onUpdateInstagramHandle={updateInstagramHandle}
          onUpdateTikTokHandle={updateTikTokHandle}
          onUpdateWebsite={updateWebsite}
          onUpdateDonation={updateDonation}
        />
      )
    } else {
      const contentListCards = (contentLists || []).map((contentList) => (
        <Card
          key={contentList.content_list_id}
          id={contentList.content_list_id}
          userId={contentList.content_list_owner_id}
          imageSize={contentList._cover_art_sizes}
          primaryText={contentList.content_list_name}
          secondaryText={formatCardSecondaryText(
            contentList.save_count,
            contentList.content_list_contents.digital_content_ids.length,
            contentList.is_private
          )}
          onClick={() =>
            goToRoute(
              contentListPage(
                profile.handle,
                contentList.content_list_name,
                contentList.content_list_id
              )
            )
          }
        />
      ))
      if (isLandlord) {
        const albumCards = (albums || []).map((album) => (
          <Card
            key={album.content_list_id}
            id={album.content_list_id}
            userId={album.content_list_owner_id}
            imageSize={album._cover_art_sizes}
            primaryText={album.content_list_name}
            secondaryText={formatCardSecondaryText(
              album.save_count,
              album.content_list_contents.digital_content_ids.length
            )}
            onClick={() =>
              goToRoute(
                albumPage(
                  profile.handle,
                  album.content_list_name,
                  album.content_list_id
                )
              )
            }
          />
        ))

        profileTabs = landlordTabs
        profileElements = [
          <div className={styles.digitalContentsLineupContainer} key='landlordDigitalContents'>
            {profile.digital_content_count === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyDigitalContents}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <Lineup
                {...getLineupProps(landlordDigitalContents)}
                leadingElementId={profile._landlord_pick}
                limit={profile.digital_content_count}
                loadMore={loadMoreLandlordDigitalContents}
                playDigitalContent={playLandlordDigitalContent}
                pauseDigitalContent={pauseLandlordDigitalContent}
                actions={digitalContentsActions}
              />
            )}
          </div>,
          <div className={styles.cardLineupContainer} key='landlordAlbums'>
            {(albums || []).length === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyAlbums}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={albumCards}
              />
            )}
          </div>,
          <div className={styles.cardLineupContainer} key='landlordContentLists'>
            {(contentLists || []).length === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyContentLists}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={contentListCards}
              />
            )}
          </div>,
          <div className={styles.digitalContentsLineupContainer} key='landlordUsers'>
            {profile.repost_count === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyReposts}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <Lineup
                {...getLineupProps(userFeed)}
                count={profile.repost_count}
                loadMore={loadMoreUserFeed}
                playDigitalContent={playUserFeedDigitalContent}
                pauseDigitalContent={pauseUserFeedDigitalContent}
                actions={feedActions}
              />
            )}
          </div>
        ]
      } else {
        profileTabs = userTabs
        profileElements = [
          <div className={styles.digitalContentsLineupContainer} key='digitalContents'>
            {profile.repost_count === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyReposts}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <Lineup
                {...getLineupProps(userFeed)}
                count={profile.repost_count}
                loadMore={loadMoreUserFeed}
                playDigitalContent={playUserFeedDigitalContent}
                pauseDigitalContent={pauseUserFeedDigitalContent}
                actions={feedActions}
              />
            )}
          </div>,
          <div className={styles.cardLineupContainer} key='contentLists'>
            {(contentLists || []).length === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyContentLists}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={contentListCards}
              />
            )}
          </div>
        ]
      }

      if (
        // `has_collectibles` is a shortcut that is only true iff the user has a modified collectibles state
        (profile?.has_collectibles &&
          profileHasCollectiblesTierRequirement &&
          !didCollectiblesLoadAndWasEmpty) ||
        (profileHasCollectiblesTierRequirement &&
          (profileHasVisibleImageOrVideoCollectibles ||
            (profileHasCollectibles && isUserOnTheirProfile)))
      ) {
        profileTabs = isLandlord
          ? landlordTabsWithCollectibles
          : userTabsWithCollectibles
        profileElements.push(
          <div key='collectibles' className={styles.digitalContentsLineupContainer}>
            <CollectiblesPage
              userId={userId}
              name={name}
              isMobile={true}
              isUserOnTheirProfile={isUserOnTheirProfile}
              updateProfilePicture={updateProfilePicture}
              profile={profile}
              onSave={onSave}
            />
          </div>
        )
      }
    }

    const { tabs, body } = useTabs({
      didChangeTabsFrom,
      tabs: isLoading ? [] : profileTabs || [],
      elements: isLoading ? [] : profileElements || [],
      initialTab: activeTab || undefined
    })

    if (profile && profile.is_deactivated) {
      content = (
        <div className={styles.contentContainer}>
          <DeactivatedProfileTombstone goToRoute={goToRoute} isMobile={true} />
        </div>
      )
    } else if (!isLoading && !isEditing) {
      content = (
        <div className={styles.contentContainer}>
          <div className={styles.tabs}>{tabs}</div>
          {body}
        </div>
      )
    }

    const asyncRefresh = useAsyncPoll({
      call: refreshProfile,
      variable: status,
      value: Status.SUCCESS
    })

    return (
      <>
        <NetworkConnectivityMonitor
          pageDidLoad={status !== Status.LOADING}
          onDidRegainConnectivity={asyncRefresh}
        >
          <MobilePageContainer
            title={name && handle ? `${name} (${handle})` : ''}
            description={bio}
            canonicalUrl={fullProfilePage(handle)}
            containerClassName={styles.container}
          >
            <PullToRefresh
              fetchContent={asyncRefresh}
              shouldPad={false}
              overImage
              isDisabled={isEditing || isUserConfirming}
            >
              <ProfileHeader
                isDeactivated={profile?.is_deactivated}
                name={name}
                handle={handle}
                isLandlord={isLandlord}
                bio={bio}
                verified={verified}
                userId={profile.user_id}
                loading={status === Status.LOADING}
                coverPhotoSizes={coverPhotoSizes}
                profilePictureSizes={profilePictureSizes}
                hasProfilePicture={hasProfilePicture}
                contentListCount={profile.content_list_count}
                digitalContentCount={profile.digital_content_count}
                followerCount={profile.follower_count}
                followingCount={profile.followee_count}
                doesFollowCurrentUser={!!profile.does_follow_current_user}
                setFollowingUserId={setFollowingUserId}
                setFollowersUserId={setFollowersUserId}
                twitterHandle={twitterHandle}
                instagramHandle={instagramHandle}
                tikTokHandle={tikTokHandle}
                website={website}
                donation={donation}
                followers={followers}
                following={following}
                isSubscribed={isSubscribed}
                onFollow={onFollow}
                onUnfollow={onConfirmUnfollow}
                goToRoute={goToRoute}
                mode={mode}
                switchToEditMode={onEdit}
                updatedProfilePicture={
                  updatedProfilePicture ? updatedProfilePicture.url : null
                }
                updatedCoverPhoto={
                  updatedCoverPhoto ? updatedCoverPhoto.url : null
                }
                onUpdateProfilePicture={updateProfilePicture}
                onUpdateCoverPhoto={updateCoverPhoto}
                setNotificationSubscription={setNotificationSubscription}
                areLandlordRecommendationsVisible={
                  areLandlordRecommendationsVisible
                }
                onCloseLandlordRecommendations={onCloseLandlordRecommendations}
              />
              {content}
            </PullToRefresh>
          </MobilePageContainer>
        </NetworkConnectivityMonitor>
        <TierExplainerDrawer />
      </>
    )
  }
)

export default ProfilePage
