import { memo, useCallback, useContext, useEffect, useMemo } from 'react'

import {
  UID,
  Name,
  UserCollection,
  LineupState,
  Status,
  User
} from '@coliving/common'
import cn from 'classnames'
import { matchPath } from 'react-router'
import { Dispatch } from 'redux'

import { ReactComponent as IconAlbum } from 'assets/img/iconAlbum.svg'
import { ReactComponent as IconBigSearch } from 'assets/img/iconBigSearch.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import { ReactComponent as IconContentLists } from 'assets/img/iconContentLists.svg'
import { ReactComponent as IconUser } from 'assets/img/iconUser.svg'
import { digitalContentsActions } from 'common/store/pages/searchResults/lineup/digital_contents/actions'
import Card from 'components/card/mobile/card'
import Header from 'components/header/mobile/header'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import CardLineup from 'components/lineup/cardLineup'
import Lineup from 'components/lineup/lineup'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/store/context'
import useTabs from 'hooks/useTabs/useTabs'
import { make, useRecord } from 'store/analytics/actions'
import { getLocationPathname } from 'store/routing/selectors'
import { useSelector } from 'utils/reducer'
import {
  albumPage,
  contentListPage,
  profilePage,
  fullSearchResultsPage,
  SEARCH_PAGE
} from 'utils/route'

import styles from './searchPageContent.module.css'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

type SearchPageContentProps = {
  digitalContents: LineupState<{}>
  contentLists: UserCollection[]
  albums: UserCollection[]
  landlords: User[]
  match: any
  searchText: string
  dispatch: Dispatch
  playing: boolean
  buffering: boolean
  containerRef: HTMLElement | null
  currentQueueItem: {
    source: any
    digital_content: any
    user: any
    uid: UID
  }
  search: {
    albumUids: UID[]
    landlordUids: UID[]
    contentListUids: UID[]
    digitalContentUids: UID[]
    searchText: string
    status: Status
    digitalContents: any
  }
  isTagSearch: boolean
  goToRoute: (route: string) => void
}

const DigitalContentSearchPageMessages = {
  title1: "Sorry, we couldn't find anything matching",
  title1Tag: "Sorry, we couldn't find any tags matching",
  title2: 'Please check your spelling or try broadening your search.'
}

const NoResults = ({
  isTagSearch,
  searchText
}: {
  isTagSearch: boolean
  searchText: string
}) => (
  <div className={styles.centeringContainer}>
    <div className={styles.noResults}>
      <IconBigSearch />
      <div>
        {isTagSearch
          ? DigitalContentSearchPageMessages.title1Tag
          : DigitalContentSearchPageMessages.title1}
      </div>
      <span>{`"${searchText}"`}</span>
      <div>{DigitalContentSearchPageMessages.title2}</div>
    </div>
  </div>
)

type SearchStatusWrapperProps = {
  status: Status
  children: JSX.Element
}

const SearchStatusWrapper = memo(
  ({ status, children }: SearchStatusWrapperProps) => {
    switch (status) {
      case Status.IDLE:
      case Status.LOADING:
      case Status.ERROR: // TODO
        return <LoadingSpinner className={styles.spinner} />
      case Status.SUCCESS:
        return children
    }
  }
)

const DigitalContentsSearchPage = ({
  search,
  searchText,
  digitalContents,
  dispatch,
  buffering,
  playing,
  currentQueueItem,
  containerRef,
  isTagSearch
}: SearchPageContentProps) => {
  const numDigitalContents = Object.keys(digitalContents.entries).length
  const loadingStatus = (() => {
    // We need to account for the odd case where search.status === success but
    // the digitalContents are still loading in (digitalContents.status === loading && digitalContents.entries === 0),
    // and in this case still show a loading screen.
    const searchAndDigitalContentsSuccess =
      search.status === Status.SUCCESS && digitalContents.status === Status.SUCCESS
    const searchSuccessDigitalContentsLoadingMore =
      search.status === Status.SUCCESS &&
      digitalContents.status === Status.LOADING &&
      numDigitalContents > 0

    if (searchAndDigitalContentsSuccess || searchSuccessDigitalContentsLoadingMore) {
      return Status.SUCCESS
    } else if (search.status === Status.ERROR) {
      return Status.ERROR
    } else {
      return Status.LOADING
    }
  })()

  return (
    <SearchStatusWrapper status={loadingStatus}>
      {numDigitalContents ? (
        <div className={styles.lineupContainer}>
          <Lineup
            selfLoad
            lineup={digitalContents}
            playingSource={currentQueueItem.source}
            playingUid={currentQueueItem.uid}
            playingDigitalContentId={
              currentQueueItem.digital_content && currentQueueItem.digital_content.digital_content_id
            }
            playing={playing}
            buffering={buffering}
            scrollParent={containerRef}
            loadMore={(offset: number, limit: number) =>
              dispatch(digitalContentsActions.fetchLineupMetadatas(offset, limit))
            }
            playDigitalContent={(uid: UID) => dispatch(digitalContentsActions.play(uid))}
            pauseDigitalContent={() => dispatch(digitalContentsActions.pause())}
            actions={digitalContentsActions}
          />
        </div>
      ) : (
        <NoResults searchText={searchText} isTagSearch={isTagSearch} />
      )}
    </SearchStatusWrapper>
  )
}

const ALBUM_CATEGORY_NAME = 'Landlords'

enum CardType {
  ALBUM = 'ALBUM',
  CONTENT_LIST = 'CONTENT_LIST',
  USER = 'USER'
}

type CardSearchPageProps = { cardType: CardType } & SearchPageContentProps

const cardSearchPageMessages = {
  followers: 'Followers'
}

/*
 * Component capable of rendering albums/contentLists/people
 */
const CardSearchPage = ({
  albums,
  contentLists,
  landlords,
  goToRoute,
  cardType,
  search,
  isTagSearch,
  searchText
}: CardSearchPageProps) => {
  const entities: Array<UserCollection | User> = (() => {
    switch (cardType) {
      case CardType.ALBUM:
        return albums
      case CardType.CONTENT_LIST:
        return contentLists
      case CardType.USER:
        return landlords
    }
  })()

  const cards = entities.map((e) => {
    const { id, userId, route, primaryText, secondaryText, imageSize, isVerified } =
      (() => {
        switch (cardType) {
          case CardType.USER: {
            const user = e as User
            const followers = `${user.follower_count} ${cardSearchPageMessages.followers}`
            return {
              id: user.user_id,
              userId: user.user_id,
              route: profilePage(user.handle),
              primaryText: user.name,
              secondaryText: followers,
              imageSize: user._profile_picture_sizes,
              isVerified: user.is_verified
            }
          }
          case CardType.ALBUM:
          case CardType.CONTENT_LIST: {
            const routeFunc =
              cardType === CardType.ALBUM ? albumPage : contentListPage
            const collection = e as UserCollection
            return {
              userId: collection.content_list_owner_id,
              id: collection.content_list_id,
              route: routeFunc(
                collection.user.handle,
                collection.content_list_name,
                collection.content_list_id
              ),
              primaryText: collection.content_list_name,
              secondaryText: collection.user.handle,
              imageSize: collection._cover_art_sizes,
              isVerified: false
            }
          }
        }
      })()

    return (
      <Card
        key={id}
        id={id}
        userId={userId}
        isUser={cardType === CardType.USER}
        imageSize={imageSize}
        primaryText={primaryText}
        secondaryText={secondaryText}
        onClick={() => goToRoute(route)}
        className=''
      />
    )
  })

  return (
    <SearchStatusWrapper status={search.status}>
      {entities.length ? (
        <div className={styles.lineupContainer}>
          <CardLineup categoryName={ALBUM_CATEGORY_NAME} cards={cards} />
        </div>
      ) : (
        <NoResults searchText={searchText} isTagSearch={isTagSearch} />
      )}
    </SearchStatusWrapper>
  )
}

const messages = {
  title: 'More Results',
  tagSearchTitle: 'Tag Search',
  digitalContentsTitle: 'DigitalContents',
  albumsTitle: 'Albums',
  contentListsTitle: 'ContentLists',
  peopleTitle: 'Profiles'
}

enum Tabs {
  DIGITAL_CONTENTS = 'DIGITAL_CONTENTS',
  ALBUMS = 'ALBUMS',
  CONTENT_LISTS = 'CONTENT_LISTS',
  PEOPLE = 'PEOPLE'
}

const SearchPageContent = (props: SearchPageContentProps) => {
  const searchTitle = props.isTagSearch ? 'Tag Search' : 'Search'

  // Set nav header
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    // If native, add the ability to navigate back to the native search
    if (NATIVE_MOBILE) {
      setLeft(LeftPreset.BACK)
      setCenter(CenterPreset.LOGO)
      setRight(null)
    } else {
      // If non-native mobile, show the notification and search icons
      setLeft(LeftPreset.NOTIFICATION)
      setCenter(CenterPreset.LOGO)
      setRight(RightPreset.SEARCH)
    }
  }, [setLeft, setCenter, setRight])

  const record = useRecord()
  const { searchText } = props
  const didChangeTabsFrom = useCallback(
    (from: string, to: string) => {
      if (from !== to)
        record(
          make(Name.SEARCH_TAB_CLICK, {
            term: searchText,
            tab: to.toLowerCase() as
              | 'people'
              | 'digitalContents'
              | 'albums'
              | 'contentLists'
          })
        )
    },
    [record, searchText]
  )
  const { isTagSearch } = props
  // Show fewer tabs if this is a tagSearch
  const computedTabs = useMemo(() => {
    return isTagSearch
      ? {
          didChangeTabsFrom,
          tabs: [
            {
              icon: <IconNote />,
              text: messages.digitalContentsTitle,
              label: Tabs.DIGITAL_CONTENTS
            },
            {
              icon: <IconUser />,
              text: messages.peopleTitle,
              label: Tabs.PEOPLE
            }
          ],
          elements: [
            <DigitalContentsSearchPage key='tagDigitalContentSearch' {...props} />,
            <CardSearchPage
              key='tagUserSearch'
              {...props}
              cardType={CardType.USER}
            />
          ]
        }
      : {
          didChangeTabsFrom,
          tabs: [
            {
              icon: <IconUser />,
              text: messages.peopleTitle,
              label: Tabs.PEOPLE
            },
            {
              icon: <IconNote />,
              text: messages.digitalContentsTitle,
              label: Tabs.DIGITAL_CONTENTS
            },
            {
              icon: <IconAlbum />,
              text: messages.albumsTitle,
              label: Tabs.ALBUMS
            },
            {
              icon: <IconContentLists />,
              text: messages.contentListsTitle,
              label: Tabs.CONTENT_LISTS
            }
          ],
          elements: [
            <CardSearchPage
              key='userSearch'
              {...props}
              cardType={CardType.USER}
            />,
            <DigitalContentsSearchPage key='digitalContentSearch' {...props} />,
            <CardSearchPage
              key='albumSearch'
              {...props}
              cardType={CardType.ALBUM}
            />,
            <CardSearchPage
              key='contentListSearch'
              {...props}
              cardType={CardType.CONTENT_LIST}
            />
          ]
        }
  }, [isTagSearch, props, didChangeTabsFrom])

  const { tabs, body } = useTabs(computedTabs)
  const { setHeader } = useContext(HeaderContext)
  const pathname = useSelector(getLocationPathname)
  useEffect(() => {
    const isSearchPage = matchPath(pathname, {
      path: SEARCH_PAGE
    })
    if (!isSearchPage) return
    setHeader(
      <>
        <Header
          className={styles.header}
          title={isTagSearch ? messages.tagSearchTitle : messages.title}
        />
        <div
          className={cn(styles.tabBar, {
            [styles.nativeTabBar]: NATIVE_MOBILE
          })}
        >
          {tabs}
        </div>
      </>
    )
  }, [setHeader, tabs, pathname, isTagSearch])

  return (
    <MobilePageContainer
      title={`${searchTitle} ${searchText}`}
      description={`Search results for ${searchText}`}
      canonicalUrl={fullSearchResultsPage(searchText)}
    >
      <div className={styles.tabContainer}>
        <div className={styles.pageContainer}>{body}</div>
      </div>
    </MobilePageContainer>
  )
}

export default SearchPageContent
