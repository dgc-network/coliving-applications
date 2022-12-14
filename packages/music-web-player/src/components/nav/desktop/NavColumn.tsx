import { MouseEvent, useCallback, useRef, useState } from 'react'

import {
  CreateContentListSource,
  FavoriteSource,
  Name,
  SquareSizes,
  ContentListLibrary as ContentListLibraryType,
  Status,
  FeatureFlags
} from '@coliving/common'
import { Scrollbar } from '@coliving/stems'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import {
  NavLink,
  RouteComponentProps,
  useHistory,
  withRouter
} from 'react-router-dom'
import useMeasure from 'react-use-measure'
import { Dispatch } from 'redux'

import imageProfilePicEmpty from 'assets/img/imageProfilePicEmpty2X.png'
import {
  getAccountStatus,
  getAccountUser,
  getContentListLibrary
} from 'common/store/account/selectors'
import { getDominantColorsByDigitalContent } from 'common/store/averageColor/slice'
import {
  addDigitalContentToContentList,
  createContentList
} from 'common/store/cache/collections/actions'
import {
  toggleNotificationPanel,
  updateContentListLastViewedAt
} from 'common/store/notifications/actions'
import {
  getNotificationPanelIsOpen,
  getNotificationUnviewedCount
} from 'common/store/notifications/selectors'
import {
  addFolderToLibrary,
  constructContentListFolder
} from 'common/store/contentListLibrary/helpers'
import { makeGetCurrent } from 'common/store/queue/selectors'
import { saveCollection } from 'common/store/social/collections/actions'
import { saveDigitalContent } from 'common/store/social/digital_contents/actions'
import * as createContentListModalActions from 'common/store/ui/createContentListModal/actions'
import {
  getHideFolderTab,
  getIsOpen
} from 'common/store/ui/createContentListModal/selectors'
import CreateContentListModal from 'components/create-content-list/CreateContentListModal'
import { DragAutoscroller } from 'components/dragAutoscroller/dragAutoscroller'
import Droppable from 'components/dragndrop/droppable'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import CurrentlyPlaying from 'components/nav/desktop/currentlyPlaying'
import NavButton from 'components/nav/desktop/navButton'
import RouteNav from 'components/nav/desktop/routeNav'
import Pill from 'components/pill/pill'
import ConnectedProfileCompletionPane from 'components/profileProgress/connectedProfileCompletionPane'
import Tooltip from 'components/tooltip/tooltip'
import UserBadges from 'components/userBadges/userBadges'
import { useFlag } from 'hooks/useRemoteConfig'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import * as signOnActions from 'pages/signOn/store/actions'
import { resetState as resetUploadState } from 'pages/uploadPage/store/actions'
import { NO_VISUALIZER_ROUTES } from 'pages/visualizer/visualizer'
import { openVisualizer } from 'pages/visualizer/store/slice'
import { make, useRecord } from 'store/analytics/actions'
import { getIsDragging } from 'store/dragndrop/selectors'
import { makeGetCurrent as makeGetCurrentPlayer } from 'store/player/selectors'
import { update as updateContentListLibrary } from 'store/contentListLibrary/slice'
import { AppState } from 'store/types'
import {
  DASHBOARD_PAGE,
  EXPLORE_PAGE,
  FEED_PAGE,
  fullDigitalContentPage,
  HISTORY_PAGE,
  contentListPage,
  profilePage,
  SAVED_PAGE,
  TRENDING_PAGE,
  UPLOAD_PAGE
} from 'utils/route'

import NavAudio from './navAudio'
import styles from './NavColumn.module.css'
import NavHeader from './navHeader'
import ContentListLibrary from './contentListLibrary'

const messages = {
  newContentListOrFolderTooltip: 'New ContentList or Folder',
  newContentListTooltip: 'New ContentList'
}

type OwnProps = {
  isElectron: boolean
}

type NavColumnProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const NavColumn = ({
  account,
  showActionRequiresAccount,
  createContentList,
  library,
  openCreateContentListModal,
  closeCreateContentListModal,
  isElectron,
  notificationCount,
  notificationPanelIsOpen,
  toggleNotificationPanel,
  showCreateContentListModal,
  hideCreateContentListModalFolderTab,
  updateContentListLibrary,
  currentQueueItem,
  currentPlayerItem,
  dragging: { dragging, kind, isOwner: draggingIsOwner },
  saveDigitalContent,
  saveCollection,
  upload,
  accountStatus,
  updateContentListLastViewedAt,
  resetUploadState,
  goToRoute,
  goToSignUp: routeToSignup,
  goToSignIn,
  goToUpload,
  showVisualizer,
  dominantColors
}: NavColumnProps) => {
  const record = useRecord()
  const { location } = useHistory()
  const { pathname } = location
  const [navBodyContainerMeasureRef, navBodyContainerBoundaries] = useMeasure({
    polyfill: ResizeObserver
  })
  const scrollbarRef = useRef<HTMLElement | null>(null)
  const [dragScrollingDirection, setDragScrollingDirection] =
    useState(undefined)
  const handleChangeDragScrollingDirection = useCallback((newDirection) => {
    setDragScrollingDirection(newDirection)
  }, [])

  const goToSignUp = useCallback(
    (source) => {
      routeToSignup()
      record(make(Name.CREATE_ACCOUNT_OPEN, { source }))
    },
    [record, routeToSignup]
  )
  const { isEnabled: isContentListFoldersEnabled } = useFlag(
    FeatureFlags.CONTENT_LIST_FOLDERS
  )

  const onClickNavProfile = useCallback(() => goToSignIn(), [goToSignIn])
  const onClickNavButton = useCallback(
    () => goToSignUp('nav button'),
    [goToSignUp]
  )

  const goToProfile = useCallback(() => {
    if (account?.handle) {
      goToRoute(profilePage(account.handle))
    }
  }, [account, goToRoute])

  const onClickToggleNotificationPanel = useCallback(() => {
    toggleNotificationPanel()
    if (!notificationPanelIsOpen)
      record(make(Name.NOTIFICATIONS_OPEN, { source: 'button' }))
  }, [notificationPanelIsOpen, toggleNotificationPanel, record])

  const onCreateContentList = useCallback(
    (metadata) => {
      const tempId = `${Date.now()}`
      createContentList(tempId, metadata)
      closeCreateContentListModal()
      if (account) {
        goToRoute(contentListPage(account.handle, metadata.content_list_name, tempId))
      }
    },
    [account, createContentList, closeCreateContentListModal, goToRoute]
  )

  const onCreateFolder = useCallback(
    (folderName) => {
      const newLibrary = addFolderToLibrary(
        library,
        constructContentListFolder(folderName)
      )
      updateContentListLibrary(newLibrary)
      closeCreateContentListModal()
    },
    [library, updateContentListLibrary, closeCreateContentListModal]
  )

  const openCreateContentList = useCallback(() => {
    if (account) {
      openCreateContentListModal()
      record(
        make(Name.CONTENT_LIST_OPEN_CREATE, { source: CreateContentListSource.NAV })
      )
    } else {
      goToSignUp('social action')
      showActionRequiresAccount()
    }
  }, [
    account,
    openCreateContentListModal,
    goToSignUp,
    showActionRequiresAccount,
    record
  ])

  const onClickNavLinkWithAccount = useCallback(
    (e?: MouseEvent<HTMLAnchorElement>, id?: number) => {
      if (!account) {
        e?.preventDefault()
        goToSignUp('restricted page')
        showActionRequiresAccount()
      } else if (id) {
        updateContentListLastViewedAt(id)
      }
    },
    [account, goToSignUp, showActionRequiresAccount, updateContentListLastViewedAt]
  )

  const updateScrollTopPosition = useCallback((difference) => {
    if (scrollbarRef != null && scrollbarRef.current !== null) {
      scrollbarRef.current.scrollTop =
        scrollbarRef.current.scrollTop + difference
    }
  }, [])

  /** @param {bool} full whether or not to get the full page link */
  const getDigitalContentPageLink = useCallback(
    (full = false) => {
      if (currentQueueItem && currentQueueItem.user && currentQueueItem.digital_content) {
        return full
          ? fullDigitalContentPage(currentQueueItem.digital_content.permalink)
          : currentQueueItem.digital_content.permalink
      }
      return null
    },
    [currentQueueItem]
  )

  const onClickArtwork = useCallback(() => {
    const route = getDigitalContentPageLink()
    if (route) goToRoute(route)
  }, [goToRoute, getDigitalContentPageLink])

  const onShowVisualizer = useCallback(
    (e) => {
      if (NO_VISUALIZER_ROUTES.has(pathname)) return
      showVisualizer()
      e.stopPropagation()
    },
    [showVisualizer, pathname]
  )

  const onClickUpload = useCallback(() => {
    if (!upload.uploading) resetUploadState()
    goToUpload()
    record(make(Name.DIGITAL_CONTENT_UPLOAD_OPEN, { source: 'nav' }))
  }, [goToUpload, upload, resetUploadState, record])

  const profileCompletionMeter = (
    <div className={styles.profileCompletionContainer}>
      <ConnectedProfileCompletionPane />
    </div>
  )

  let name, handle
  if (account) {
    name = account.name
    handle = account.handle
  }

  const profileImage = useUserProfilePicture(
    account ? account.user_id : null,
    account ? account._profile_picture_sizes : null,
    SquareSizes.SIZE_150_BY_150
  )

  let navButtonStatus = 'signedOut'
  if (account) navButtonStatus = 'signedIn'
  if (upload.uploading) navButtonStatus = 'uploading'
  if (accountStatus === Status.LOADING) navButtonStatus = 'loading'

  const navLoaded =
    accountStatus === Status.SUCCESS || accountStatus === Status.ERROR

  return (
    <nav id='navColumn' className={styles.navColumn}>
      {isElectron && <RouteNav />}
      <NavHeader
        account={account}
        notificationCount={notificationCount}
        notificationPanelIsOpen={notificationPanelIsOpen}
        toggleNotificationPanel={onClickToggleNotificationPanel}
        goToRoute={goToRoute}
        isElectron={isElectron}
      />
      <div
        ref={navBodyContainerMeasureRef}
        className={cn(styles.navContent, {
          [styles.show]: navLoaded,
          [styles.dragScrollingUp]: dragScrollingDirection === 'up',
          [styles.dragScrollingDown]: dragScrollingDirection === 'down'
        })}
      >
        <Scrollbar
          containerRef={(el) => {
            scrollbarRef.current = el
          }}
          className={styles.scrollable}
        >
          <DragAutoscroller
            containerBoundaries={navBodyContainerBoundaries}
            updateScrollTopPosition={updateScrollTopPosition}
            onChangeDragScrollingDirection={handleChangeDragScrollingDirection}
          >
            {account ? (
              <div className={styles.userHeader}>
                <div className={styles.accountWrapper}>
                  <DynamicImage
                    wrapperClassName={styles.wrapperPhoto}
                    className={styles.dynamicPhoto}
                    skeletonClassName={styles.wrapperPhotoSkeleton}
                    onClick={goToProfile}
                    image={profileImage}
                  />
                  <div className={styles.userInfoWrapper}>
                    <div className={styles.name} onClick={goToProfile}>
                      {name}
                      <UserBadges
                        userId={account.user_id}
                        badgeSize={12}
                        className={styles.badge}
                      />
                    </div>
                    <div className={styles.handleContainer}>
                      <span
                        className={styles.handle}
                        onClick={goToProfile}
                      >{`@${handle}`}</span>
                    </div>
                  </div>
                </div>
                <NavAudio />
              </div>
            ) : (
              <div className={styles.userHeader}>
                <div className={styles.accountWrapper}>
                  <div
                    className={styles.photo}
                    style={{ backgroundImage: `url(${imageProfilePicEmpty})` }}
                    onClick={onClickNavProfile}
                  />
                  <div className={styles.userInfoWrapper}>
                    <div className={styles.haveAccount}>Have an Account?</div>
                    <div className={styles.logIn} onClick={onClickNavProfile}>
                      Sign In
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.links}>
              <div className={styles.linkGroup}>
                <div className={styles.groupHeader}>Discover</div>
                <NavLink
                  to={FEED_PAGE}
                  activeClassName='active'
                  className={cn(styles.link, {
                    [styles.disabledLink]: !account || dragging
                  })}
                  onClick={onClickNavLinkWithAccount}
                >
                  Feed
                </NavLink>
                <NavLink
                  to={TRENDING_PAGE}
                  activeClassName='active'
                  className={cn(styles.link, {
                    [styles.disabledLink]: dragging
                  })}
                >
                  Trending
                </NavLink>
                <NavLink
                  to={EXPLORE_PAGE}
                  exact
                  activeClassName='active'
                  className={cn(styles.link, {
                    [styles.disabledLink]: dragging
                  })}
                >
                  Explore
                </NavLink>
              </div>
              <div className={styles.linkGroup}>
                <div className={styles.groupHeader}>Library</div>
                <Droppable
                  className={styles.droppable}
                  hoverClassName={styles.droppableHover}
                  acceptedKinds={['digital_content', 'album']}
                  acceptOwner={false}
                  onDrop={kind === 'album' ? saveCollection : saveDigitalContent}
                >
                  <NavLink
                    to={SAVED_PAGE}
                    activeClassName='active'
                    className={cn(styles.link, {
                      [styles.disabledLink]:
                        !account ||
                        (dragging && kind === 'contentList') ||
                        draggingIsOwner,
                      [styles.droppableLink]:
                        dragging &&
                        !draggingIsOwner &&
                        (kind === 'digital_content' || kind === 'album')
                    })}
                    onClick={onClickNavLinkWithAccount}
                  >
                    Favorites
                  </NavLink>
                </Droppable>
                <NavLink
                  to={HISTORY_PAGE}
                  activeClassName='active'
                  className={cn(styles.link, {
                    [styles.disabledLink]: !account || dragging
                  })}
                  onClick={onClickNavLinkWithAccount}
                >
                  History
                </NavLink>
              </div>
              <div className={styles.linkGroup}>
                <Droppable
                  className={styles.droppableGroup}
                  hoverClassName={styles.droppableGroupHover}
                  onDrop={saveCollection}
                  acceptedKinds={['contentList']}
                >
                  <div
                    className={cn(styles.groupHeader, {
                      [styles.droppableLink]: dragging && kind === 'contentList'
                    })}
                  >
                    ContentLists
                    <div className={styles.newContentList}>
                      <Tooltip
                        text={
                          isContentListFoldersEnabled
                            ? messages.newContentListOrFolderTooltip
                            : messages.newContentListTooltip
                        }
                        mount='parent'
                      >
                        <span>
                          <Pill
                            text='New'
                            icon='save'
                            onClick={openCreateContentList}
                          />
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                  <ContentListLibrary
                    onClickNavLinkWithAccount={onClickNavLinkWithAccount}
                  />
                </Droppable>
              </div>
            </div>
          </DragAutoscroller>
        </Scrollbar>
        <CreateContentListModal
          visible={showCreateContentListModal}
          onCreateContentList={onCreateContentList}
          onCreateFolder={onCreateFolder}
          onCancel={closeCreateContentListModal}
          hideFolderTab={hideCreateContentListModalFolderTab}
        />
      </div>
      <div className={styles.navAnchor}>
        {profileCompletionMeter}
        <NavButton
          status={navButtonStatus}
          onCreateAccount={onClickNavButton}
          onUpload={onClickUpload}
        />
        <CurrentlyPlaying
          digitalContentId={currentQueueItem.digital_content?.digital_content_id ?? null}
          digitalContentTitle={currentQueueItem.digital_content?.title ?? null}
          isUnlisted={currentQueueItem.digital_content?.is_unlisted ?? false}
          isOwner={
            // Note: if neither are defined, it should eval to false, so setting default to different values
            (currentQueueItem?.user?.handle ?? null) ===
            (account?.handle ?? undefined)
          }
          coverArtColor={dominantColors ? dominantColors[0] : null}
          coverArtSizes={currentQueueItem.digital_content?._cover_art_sizes ?? null}
          artworkLink={
            currentPlayerItem.collectible?.imageUrl ||
            currentPlayerItem.collectible?.frameUrl ||
            currentPlayerItem.collectible?.gifUrl
          }
          draggableLink={getDigitalContentPageLink()}
          onClick={onClickArtwork}
          onShowVisualizer={onShowVisualizer}
        />
      </div>
    </nav>
  )
}

const getCurrentQueueItem = makeGetCurrent()
const getCurrentPlayerItem = makeGetCurrentPlayer()

const mapStateToProps = (state: AppState) => {
  const currentQueueItem = getCurrentQueueItem(state)
  const currentPlayerItem = getCurrentPlayerItem(state)
  return {
    currentQueueItem,
    currentPlayerItem,
    account: getAccountUser(state),
    accountStatus: getAccountStatus(state),
    dragging: getIsDragging(state),
    notificationCount: getNotificationUnviewedCount(state),
    notificationPanelIsOpen: getNotificationPanelIsOpen(state),
    upload: state.upload,
    library: getContentListLibrary(state),
    showCreateContentListModal: getIsOpen(state),
    hideCreateContentListModalFolderTab: getHideFolderTab(state),
    dominantColors: getDominantColorsByDigitalContent(state, {
      digital_content: currentQueueItem.digital_content
    })
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  resetUploadState: () => dispatch(resetUploadState()),
  createContentList: (tempId: string, metadata: Record<string, unknown>) =>
    dispatch(createContentList(tempId, metadata, CreateContentListSource.NAV)),
  goToRoute: (route: string) => dispatch(pushRoute(route)),
  saveDigitalContent: (digitalContentId: number) =>
    dispatch(saveDigitalContent(digitalContentId, FavoriteSource.NAVIGATOR)),
  saveCollection: (collectionId: number) =>
    dispatch(saveCollection(collectionId, FavoriteSource.NAVIGATOR)),
  addDigitalContentToContentList: (digitalContentId: number, contentListId: number) =>
    dispatch(addDigitalContentToContentList(digitalContentId, contentListId)),
  showActionRequiresAccount: () =>
    dispatch(signOnActions.showRequiresAccountModal()),
  toggleNotificationPanel: () => dispatch(toggleNotificationPanel()),
  openCreateContentListModal: () => dispatch(createContentListModalActions.open()),
  closeCreateContentListModal: () => dispatch(createContentListModalActions.close()),
  updateContentListLastViewedAt: (contentListId: number) =>
    dispatch(updateContentListLastViewedAt(contentListId)),
  updateContentListLibrary: (newLibrary: ContentListLibraryType) =>
    dispatch(updateContentListLibrary({ contentListLibrary: newLibrary })),
  goToUpload: () => dispatch(pushRoute(UPLOAD_PAGE)),
  goToDashboard: () => dispatch(pushRoute(DASHBOARD_PAGE)),
  goToSignUp: () => dispatch(signOnActions.openSignOn(/** signIn */ false)),
  goToSignIn: () => dispatch(signOnActions.openSignOn(/** signIn */ true)),
  showVisualizer: () => dispatch(openVisualizer())
})

const ConnectedNavColumn = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(NavColumn)
)

export default ConnectedNavColumn
