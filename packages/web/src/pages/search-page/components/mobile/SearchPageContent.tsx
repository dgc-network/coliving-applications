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
import { agreementsActions } from 'common/store/pages/search-results/lineup/agreements/actions'
import Card from 'components/card/mobile/Card'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import Lineup from 'components/lineup/Lineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
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

import styles from './SearchPageContent.module.css'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

type SearchPageContentProps = {
  agreements: LineupState<{}>
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
    agreement: any
    user: any
    uid: UID
  }
  search: {
    albumUids: UID[]
    landlordUids: UID[]
    contentListUids: UID[]
    agreementUids: UID[]
    searchText: string
    status: Status
    agreements: any
  }
  isTagSearch: boolean
  goToRoute: (route: string) => void
}

const AgreementSearchPageMessages = {
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
          ? AgreementSearchPageMessages.title1Tag
          : AgreementSearchPageMessages.title1}
      </div>
      <span>{`"${searchText}"`}</span>
      <div>{AgreementSearchPageMessages.title2}</div>
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

const AgreementsSearchPage = ({
  search,
  searchText,
  agreements,
  dispatch,
  buffering,
  playing,
  currentQueueItem,
  containerRef,
  isTagSearch
}: SearchPageContentProps) => {
  const numAgreements = Object.keys(agreements.entries).length
  const loadingStatus = (() => {
    // We need to account for the odd case where search.status === success but
    // the agreements are still loading in (agreements.status === loading && agreements.entries === 0),
    // and in this case still show a loading screen.
    const searchAndAgreementsSuccess =
      search.status === Status.SUCCESS && agreements.status === Status.SUCCESS
    const searchSuccessAgreementsLoadingMore =
      search.status === Status.SUCCESS &&
      agreements.status === Status.LOADING &&
      numAgreements > 0

    if (searchAndAgreementsSuccess || searchSuccessAgreementsLoadingMore) {
      return Status.SUCCESS
    } else if (search.status === Status.ERROR) {
      return Status.ERROR
    } else {
      return Status.LOADING
    }
  })()

  return (
    <SearchStatusWrapper status={loadingStatus}>
      {numAgreements ? (
        <div className={styles.lineupContainer}>
          <Lineup
            selfLoad
            lineup={agreements}
            playingSource={currentQueueItem.source}
            playingUid={currentQueueItem.uid}
            playingAgreementId={
              currentQueueItem.agreement && currentQueueItem.agreement.agreement_id
            }
            playing={playing}
            buffering={buffering}
            scrollParent={containerRef}
            loadMore={(offset: number, limit: number) =>
              dispatch(agreementsActions.fetchLineupMetadatas(offset, limit))
            }
            playAgreement={(uid: UID) => dispatch(agreementsActions.play(uid))}
            pauseAgreement={() => dispatch(agreementsActions.pause())}
            actions={agreementsActions}
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
    const { id, userId, route, primaryText, secondaryText, imageSize } =
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
              userId: collection.contentList_owner_id,
              id: collection.contentList_id,
              route: routeFunc(
                collection.user.handle,
                collection.contentList_name,
                collection.contentList_id
              ),
              primaryText: collection.contentList_name,
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
  agreementsTitle: 'Agreements',
  albumsTitle: 'Albums',
  contentListsTitle: 'ContentLists',
  peopleTitle: 'Profiles'
}

enum Tabs {
  AGREEMENTS = 'AGREEMENTS',
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
              | 'agreements'
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
              text: messages.agreementsTitle,
              label: Tabs.AGREEMENTS
            },
            {
              icon: <IconUser />,
              text: messages.peopleTitle,
              label: Tabs.PEOPLE
            }
          ],
          elements: [
            <AgreementsSearchPage key='tagAgreementSearch' {...props} />,
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
              text: messages.agreementsTitle,
              label: Tabs.AGREEMENTS
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
            <AgreementsSearchPage key='agreementSearch' {...props} />,
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
