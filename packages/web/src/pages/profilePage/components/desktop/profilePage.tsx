import { useCallback, memo } from 'react'

import {
  ID,
  UID,
  Name,
  Collection,
  CoverPhotoSizes,
  ProfilePictureSizes,
  LineupState,
  Status
} from '@coliving/common'

import { ReactComponent as IconAlbum } from 'assets/img/iconAlbum.svg'
import { ReactComponent as IconCollectibles } from 'assets/img/iconCollectibles.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import { ReactComponent as IconContentLists } from 'assets/img/iconContentLists.svg'
import { ReactComponent as IconReposts } from 'assets/img/iconRepost.svg'
import { useSelectTierInfo } from 'common/hooks/wallet'
import { feedActions } from 'common/store/pages/profile/lineups/feed/actions'
import { agreementsActions } from 'common/store/pages/profile/lineups/agreements/actions'
import { ProfileUser, Tabs } from 'common/store/pages/profile/types'
import { badgeTiers } from 'common/store/wallet/utils'
import Card from 'components/card/desktop/card'
import CollectiblesPage from 'components/collectibles/components/collectiblesPage'
import CoverPhoto from 'components/coverPhoto/coverPhoto'
import CardLineup from 'components/lineup/cardLineup'
import Lineup from 'components/lineup/lineup'
import Mask from 'components/mask/mask'
import NavBanner from 'components/navBanner/navBanner'
import Page from 'components/page/page'
import ConnectedProfileCompletionHeroCard from 'components/profileProgress/connectedProfileCompletionHeroCard'
import StatBanner from 'components/statBanner/statBanner'
import UploadChip from 'components/upload/uploadChip'
import useTabs, { useTabRecalculator } from 'hooks/useTabs/useTabs'
import { MIN_COLLECTIBLES_TIER } from 'pages/profilePage/profilePageProvider'
import EmptyTab from 'pages/profilePage/components/emptyTab'
import { make, useRecord } from 'store/analytics/actions'
import {
  albumPage,
  contentListPage,
  profilePage,
  fullProfilePage,
  UPLOAD_PAGE,
  UPLOAD_ALBUM_PAGE,
  UPLOAD_CONTENT_LIST_PAGE
} from 'utils/route'

import { DeactivatedProfileTombstone } from '../deactivatedProfileTombstone'

import styles from './profilePage.module.css'
import ProfileWrapping from './profileWrapping'

export type ProfilePageProps = {
  // State
  editMode: boolean
  shouldMaskContent: boolean
  areLandlordRecommendationsVisible: boolean

  mostUsedTags: string[]
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
  updatedCoverPhoto: { error: boolean; url: string }
  profilePictureSizes: ProfilePictureSizes | null
  updatedProfilePicture: { error: boolean; url: string }
  hasProfilePicture: boolean
  activeTab: Tabs | null
  dropdownDisabled: boolean
  following: boolean
  isSubscribed: boolean
  mode: string
  stats: Array<{ number: number; title: string; key: string }>

  profile: ProfileUser | null
  albums: Collection[] | null
  contentLists: Collection[] | null
  status: Status
  goToRoute: (route: string) => void
  landlordAgreements: LineupState<{ id: ID }>
  playLandlordAgreement: (uid: UID) => void
  pauseLandlordAgreement: () => void
  // Feed
  userFeed: LineupState<{ id: ID }>
  playUserFeedAgreement: (uid: UID) => void
  pauseUserFeedAgreement: () => void

  // Methods
  onFollow: () => void
  onUnfollow: () => void
  updateName: (name: string) => void
  updateBio: (bio: string) => void
  updateLocation: (location: string) => void
  updateTwitterHandle: (handle: string) => void
  updateInstagramHandle: (handle: string) => void
  updateTikTokHandle: (handle: string) => void
  updateWebsite: (website: string) => void
  updateDonation: (donation: string) => void
  changeTab: (tab: Tabs) => void
  getLineupProps: (lineup: any) => any
  onEdit: () => void
  onSave: () => void
  onShare: () => void
  onCancel: () => void
  onSortByRecent: () => void
  onSortByPopular: () => void
  loadMoreLandlordAgreements: (offset: number, limit: number) => void
  loadMoreUserFeed: (offset: number, limit: number) => void
  formatCardSecondaryText: (
    saves: number,
    agreements: number,
    isPrivate?: boolean
  ) => string
  openCreateContentListModal: () => void
  updateProfile: (metadata: any) => void
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
  onCloseLandlordRecommendations: () => void
}

const ProfilePage = ({
  isOwner,
  profile,
  albums,
  contentLists,
  status,
  goToRoute,
  // Agreements
  landlordAgreements,
  playLandlordAgreement,
  pauseLandlordAgreement,
  getLineupProps,
  // Feed
  userFeed,
  playUserFeedAgreement,
  pauseUserFeedAgreement,
  formatCardSecondaryText,
  loadMoreUserFeed,
  loadMoreLandlordAgreements,
  openCreateContentListModal,
  updateProfile,

  mostUsedTags,
  onFollow,
  onUnfollow,
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
  changeTab,
  mode,
  stats,
  onEdit,
  onSave,
  onShare,
  onCancel,
  onSortByRecent,
  onSortByPopular,
  isLandlord,
  status: profileLoadingStatus,
  activeTab,
  shouldMaskContent,
  editMode,
  areLandlordRecommendationsVisible,
  onCloseLandlordRecommendations,

  accountUserId,
  userId,
  handle,
  verified,
  created,
  name,
  bio,
  location,
  twitterHandle,
  instagramHandle,
  tikTokHandle,
  twitterVerified,
  instagramVerified,
  website,
  donation,
  coverPhotoSizes,
  updatedCoverPhoto,
  profilePictureSizes,
  updatedProfilePicture,
  hasProfilePicture,
  dropdownDisabled,
  following,
  isSubscribed,
  setNotificationSubscription,
  didChangeTabsFrom
}: ProfilePageProps) => {
  const renderProfileCompletionCard = () => {
    return isOwner ? <ConnectedProfileCompletionHeroCard /> : null
  }
  const record = useRecord()
  const onClickUploadAlbum = useCallback(() => {
    goToRoute(UPLOAD_ALBUM_PAGE)
    record(make(Name.AGREEMENT_UPLOAD_OPEN, { source: 'profile' }))
  }, [goToRoute, record])
  const onClickUploadContentList = useCallback(() => {
    goToRoute(UPLOAD_CONTENT_LIST_PAGE)
    record(make(Name.AGREEMENT_UPLOAD_OPEN, { source: 'profile' }))
  }, [goToRoute, record])
  const onClickUploadAgreement = useCallback(() => {
    goToRoute(UPLOAD_PAGE)
    record(make(Name.AGREEMENT_UPLOAD_OPEN, { source: 'profile' }))
  }, [goToRoute, record])

  const { tierNumber } = useSelectTierInfo(userId ?? 0)
  const profileHasCollectiblesTierRequirement =
    tierNumber >= badgeTiers.findIndex((t) => t.tier === MIN_COLLECTIBLES_TIER)

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

  const tabRecalculator = useTabRecalculator()
  const recalculate = useCallback(() => {
    tabRecalculator.recalculate()
  }, [tabRecalculator])

  const getLandlordProfileContent = () => {
    if (!profile || !albums || !contentLists) return { headers: [], elements: [] }
    const albumCards = albums.map((album, index) => (
      <Card
        key={index}
        size='medium'
        handle={profile.handle}
        contentListName={album.content_list_name}
        contentListId={album.content_list_id}
        id={album.content_list_id}
        userId={album.content_list_owner_id}
        isPublic={!album.is_private}
        imageSize={album._cover_art_sizes}
        isContentList={!album.is_album}
        primaryText={album.content_list_name}
        // link={fullAlbumPage(profile.handle, album.content_list_name, album.content_list_id)}
        secondaryText={formatCardSecondaryText(
          album.save_count,
          album.content_list_contents.agreement_ids.length
        )}
        cardCoverImageSizes={album._cover_art_sizes}
        isReposted={album.has_current_user_reposted}
        isSaved={album.has_current_user_saved}
        onClick={() =>
          goToRoute(
            albumPage(profile.handle, album.content_list_name, album.content_list_id)
          )
        }
      />
    ))
    if (isOwner) {
      albumCards.unshift(
        <UploadChip
          key='upload-chip'
          type='album'
          variant='card'
          onClick={onClickUploadAlbum}
          isFirst={albumCards.length === 0}
        />
      )
    }

    const contentListCards = contentLists.map((contentList, index) => (
      <Card
        key={index}
        size='medium'
        handle={profile.handle}
        contentListName={contentList.content_list_name}
        contentListId={contentList.content_list_id}
        id={contentList.content_list_id}
        imageSize={contentList._cover_art_sizes}
        userId={contentList.content_list_owner_id}
        isPublic={!contentList.is_private}
        // isAlbum={contentList.is_album}
        primaryText={contentList.content_list_name}
        // link={fullContentListPage(profile.handle, contentList.content_list_name, contentList.content_list_id)}
        secondaryText={formatCardSecondaryText(
          contentList.save_count,
          contentList.content_list_contents.agreement_ids.length,
          contentList.is_private
        )}
        cardCoverImageSizes={contentList._cover_art_sizes}
        isReposted={contentList.has_current_user_reposted}
        isSaved={contentList.has_current_user_saved}
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
    if (isOwner) {
      contentListCards.unshift(
        <UploadChip
          key='upload-chip'
          type='contentList'
          variant='card'
          onClick={onClickUploadContentList}
          isLandlord
          isFirst={contentListCards.length === 0}
        />
      )
    }

    const agreementUploadChip = isOwner ? (
      <UploadChip
        key='upload-chip'
        type='agreement'
        variant='tile'
        onClick={onClickUploadAgreement}
      />
    ) : null

    const headers = [
      { icon: <IconNote />, text: Tabs.AGREEMENTS, label: Tabs.AGREEMENTS },
      { icon: <IconAlbum />, text: Tabs.ALBUMS, label: Tabs.ALBUMS },
      {
        icon: <IconContentLists />,
        text: Tabs.CONTENT_LISTS,
        label: Tabs.CONTENT_LISTS
      },
      { icon: <IconReposts />, text: Tabs.REPOSTS, label: Tabs.REPOSTS }
    ]
    const elements = [
      <div key={Tabs.AGREEMENTS} className={styles.tiles}>
        {renderProfileCompletionCard()}
        {status !== Status.LOADING ? (
          landlordAgreements.status !== Status.LOADING &&
          landlordAgreements.entries.length === 0 ? (
            <EmptyTab
              isOwner={isOwner}
              name={profile.name}
              text={'uploaded any agreements'}
            />
          ) : (
            <Lineup
              {...getLineupProps(landlordAgreements)}
              extraPrecedingElement={agreementUploadChip}
              animateLeadingElement
              leadingElementId={profile._landlord_pick}
              loadMore={loadMoreLandlordAgreements}
              playAgreement={playLandlordAgreement}
              pauseAgreement={pauseLandlordAgreement}
              actions={agreementsActions}
            />
          )
        ) : null}
      </div>,
      <div key={Tabs.ALBUMS} className={styles.cards}>
        {albums.length === 0 && !isOwner ? (
          <EmptyTab
            isOwner={isOwner}
            name={profile.name}
            text={'created any albums'}
          />
        ) : (
          <CardLineup cardsClassName={styles.cardLineup} cards={albumCards} />
        )}
      </div>,
      <div key={Tabs.CONTENT_LISTS} className={styles.cards}>
        {contentLists.length === 0 && !isOwner ? (
          <EmptyTab
            isOwner={isOwner}
            name={profile.name}
            text={'created any contentLists'}
          />
        ) : (
          <CardLineup
            cardsClassName={styles.cardLineup}
            cards={contentListCards}
          />
        )}
      </div>,
      <div key={Tabs.REPOSTS} className={styles.tiles}>
        {status !== Status.LOADING ? (
          (userFeed.status !== Status.LOADING &&
            userFeed.entries.length === 0) ||
          profile.repost_count === 0 ? (
            <EmptyTab
              isOwner={isOwner}
              name={profile.name}
              text={'reposted anything'}
            />
          ) : (
            <Lineup
              {...getLineupProps(userFeed)}
              loadMore={loadMoreUserFeed}
              playAgreement={playUserFeedAgreement}
              pauseAgreement={pauseUserFeedAgreement}
              actions={feedActions}
            />
          )
        ) : null}
      </div>
    ]

    if (
      // `has_collectibles` is a shortcut that is only true iff the user has a modified collectibles state
      (profile?.has_collectibles &&
        profileHasCollectiblesTierRequirement &&
        !didCollectiblesLoadAndWasEmpty) ||
      (profileHasCollectiblesTierRequirement &&
        (profileHasVisibleImageOrVideoCollectibles ||
          (profileHasCollectibles && isUserOnTheirProfile)))
    ) {
      headers.push({
        icon: <IconCollectibles />,
        text: Tabs.COLLECTIBLES,
        label: Tabs.COLLECTIBLES
      })

      elements.push(
        <div key={Tabs.COLLECTIBLES} className={styles.tiles}>
          <CollectiblesPage
            userId={userId}
            name={name}
            isMobile={false}
            isUserOnTheirProfile={isUserOnTheirProfile}
            profile={profile}
            updateProfile={updateProfile}
            updateProfilePicture={updateProfilePicture}
            onLoad={recalculate}
            onSave={onSave}
          />
        </div>
      )
    }

    return { headers, elements }
  }

  const toggleNotificationSubscription = () => {
    if (!userId) return
    setNotificationSubscription(userId, !isSubscribed)
  }

  const getUserProfileContent = () => {
    if (!profile || !contentLists) return { headers: [], elements: [] }
    const contentListCards = contentLists.map((contentList, index) => (
      <Card
        key={index}
        size='medium'
        id={contentList.content_list_id}
        userId={contentList.content_list_owner_id}
        imageSize={contentList._cover_art_sizes}
        handle={profile.handle}
        contentListId={contentList.content_list_id}
        isPublic={!contentList.is_private}
        contentListName={contentList.content_list_name}
        // isAlbum={contentList.is_album}
        primaryText={contentList.content_list_name}
        secondaryText={formatCardSecondaryText(
          contentList.save_count,
          contentList.content_list_contents.agreement_ids.length,
          contentList.is_private
        )}
        // link={fullContentListPage(profile.handle, contentList.content_list_name, contentList.content_list_id)}
        isReposted={contentList.has_current_user_reposted}
        isSaved={contentList.has_current_user_saved}
        cardCoverImageSizes={contentList._cover_art_sizes}
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
    contentListCards.unshift(
      <UploadChip
        type='contentList'
        variant='card'
        onClick={openCreateContentListModal}
        isFirst={contentListCards.length === 0}
      />
    )

    const headers = [
      { icon: <IconReposts />, text: Tabs.REPOSTS, label: Tabs.REPOSTS },
      { icon: <IconContentLists />, text: Tabs.CONTENT_LISTS, label: Tabs.CONTENT_LISTS }
    ]
    const elements = [
      <div key={Tabs.REPOSTS} className={styles.tiles}>
        {renderProfileCompletionCard()}
        {(userFeed.status !== Status.LOADING &&
          userFeed.entries.length === 0) ||
        profile.repost_count === 0 ? (
          <EmptyTab
            isOwner={isOwner}
            name={profile.name}
            text={'reposted anything'}
          />
        ) : (
          <Lineup
            {...getLineupProps(userFeed)}
            count={profile.repost_count}
            loadMore={loadMoreUserFeed}
            playAgreement={playUserFeedAgreement}
            pauseAgreement={pauseUserFeedAgreement}
            actions={feedActions}
          />
        )}
      </div>,
      <div key={Tabs.CONTENT_LISTS} className={styles.cards}>
        {contentLists.length === 0 && !isOwner ? (
          <EmptyTab
            isOwner={isOwner}
            name={profile.name}
            text={'created any contentLists'}
          />
        ) : (
          <CardLineup
            cardsClassName={styles.cardLineup}
            cards={contentListCards}
          />
        )}
      </div>
    ]

    if (
      (profile?.has_collectibles &&
        profileHasCollectiblesTierRequirement &&
        !didCollectiblesLoadAndWasEmpty) ||
      (profileHasCollectiblesTierRequirement &&
        (profileHasVisibleImageOrVideoCollectibles ||
          (profileHasCollectibles && isUserOnTheirProfile)))
    ) {
      headers.push({
        icon: <IconCollectibles />,
        text: Tabs.COLLECTIBLES,
        label: Tabs.COLLECTIBLES
      })

      elements.push(
        <div key={Tabs.COLLECTIBLES} className={styles.tiles}>
          <CollectiblesPage
            userId={userId}
            name={name}
            isMobile={false}
            isUserOnTheirProfile={isUserOnTheirProfile}
            profile={profile}
            updateProfile={updateProfile}
            updateProfilePicture={updateProfilePicture}
            onLoad={recalculate}
            onSave={onSave}
          />
        </div>
      )
    }

    return { headers, elements }
  }

  const { headers, elements } = profile
    ? isLandlord
      ? getLandlordProfileContent()
      : getUserProfileContent()
    : { headers: [], elements: [] }

  const { tabs, body } = useTabs({
    didChangeTabsFrom,
    isMobile: false,
    tabs: headers,
    tabRecalculator,
    bodyClassName: styles.tabBody,
    initialTab: activeTab || undefined,
    elements
  })

  return (
    <Page
      title={name && handle ? `${name} (${handle})` : ''}
      description={bio}
      canonicalUrl={fullProfilePage(handle)}
      variant='flush'
      contentClassName={styles.profilePageWrapper}
      scrollableSearch
    >
      <div className={styles.headerWrapper}>
        <ProfileWrapping
          userId={userId}
          isDeactivated={!!profile?.is_deactivated}
          loading={status === Status.LOADING}
          verified={verified}
          profilePictureSizes={profilePictureSizes}
          updatedProfilePicture={updatedProfilePicture}
          hasProfilePicture={hasProfilePicture}
          doesFollowCurrentUser={profile?.does_follow_current_user || false}
          isOwner={isOwner}
          isLandlord={isLandlord}
          editMode={editMode}
          name={name}
          handle={handle}
          bio={bio}
          location={location}
          twitterHandle={twitterHandle}
          instagramHandle={instagramHandle}
          tikTokHandle={tikTokHandle}
          twitterVerified={!!twitterVerified}
          instagramVerified={!!instagramVerified}
          website={website}
          donation={donation}
          created={created}
          tags={mostUsedTags || []}
          onUpdateName={updateName}
          onUpdateProfilePicture={updateProfilePicture}
          onUpdateBio={updateBio}
          onUpdateLocation={updateLocation}
          onUpdateTwitterHandle={updateTwitterHandle}
          onUpdateInstagramHandle={updateInstagramHandle}
          onUpdateTikTokHandle={updateTikTokHandle}
          onUpdateWebsite={updateWebsite}
          onUpdateDonation={updateDonation}
          goToRoute={goToRoute}
        />
        <CoverPhoto
          userId={userId}
          coverPhotoSizes={
            profile && profile.is_deactivated ? null : coverPhotoSizes
          }
          updatedCoverPhoto={updatedCoverPhoto ? updatedCoverPhoto.url : ''}
          error={updatedCoverPhoto ? updatedCoverPhoto.error : false}
          loading={profileLoadingStatus === Status.LOADING}
          onDrop={updateCoverPhoto}
          edit={editMode}
          darken={editMode}
        />
        <Mask show={editMode} zIndex={2}>
          <StatBanner
            empty={!profile || profile.is_deactivated}
            mode={mode}
            stats={stats}
            userId={accountUserId}
            handle={handle}
            profileId={profile?.user_id}
            areLandlordRecommendationsVisible={areLandlordRecommendationsVisible}
            onCloseLandlordRecommendations={onCloseLandlordRecommendations}
            onClickLandlordName={(handle: string) => {
              goToRoute(profilePage(handle))
            }}
            onEdit={onEdit}
            onSave={onSave}
            onShare={onShare}
            onCancel={onCancel}
            following={following}
            isSubscribed={isSubscribed}
            onToggleSubscribe={toggleNotificationSubscription}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
          />
          <div className={styles.inset}>
            <NavBanner
              empty={!profile || profile.is_deactivated}
              tabs={tabs}
              dropdownDisabled={dropdownDisabled}
              onChange={changeTab}
              activeTab={activeTab}
              isLandlord={isLandlord}
              onSortByRecent={onSortByRecent}
              onSortByPopular={onSortByPopular}
              shouldMaskContent={shouldMaskContent}
            />
            <div className={styles.content}>
              {profile && profile.is_deactivated ? (
                <DeactivatedProfileTombstone goToRoute={goToRoute} />
              ) : (
                body
              )}
            </div>
          </div>
        </Mask>
      </div>
    </Page>
  )
}

export default memo(ProfilePage)
