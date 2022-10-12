import {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useCallback
} from 'react'

import {
  UserCollection,
  SmartCollection,
  Variant as CollectionVariant,
  Status,
  User
} from '@coliving/common'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconForYou } from 'assets/img/iconExploreMobileForYou.svg'
import { ReactComponent as IconMoods } from 'assets/img/iconExploreMobileMoods.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import { ReactComponent as IconUser } from 'assets/img/iconUser.svg'
import { getTab } from 'common/store/pages/explore/selectors'
import { setTab } from 'common/store/pages/explore/slice'
import {
  Tabs as ExploreTabs,
  ExploreCollectionsVariant
} from 'common/store/pages/explore/types'
import Card from 'components/card/mobile/card'
import Header from 'components/header/mobile/header'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import CardLineup from 'components/lineup/cardLineup'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import { useMainPageHeader } from 'components/nav/store/context'
import useTabs from 'hooks/useTabs/useTabs'
import {
  CHILL_CONTENT_LISTS,
  UPBEAT_CONTENT_LISTS,
  INTENSE_CONTENT_LISTS,
  PROVOKING_CONTENT_LISTS,
  INTIMATE_CONTENT_LISTS,
  ExploreCollection,
  ExploreMoodCollection
} from 'pages/explorePage/collections'
import {
  contentListPage,
  albumPage,
  profilePage,
  BASE_URL,
  EXPLORE_PAGE
} from 'utils/route'

import { justForYou } from '../desktop/explorePage'

import ColorTile from './colorTile'
import styles from './explorePage.module.css'

const messages = {
  pageName: 'Explore',
  pageDescription: 'Explore featured content on Coliving',
  forYou: 'For You',
  moods: 'Moods',
  contentLists: 'ContentLists',
  landlords: 'Landlords',
  featuredContentLists: 'Featured ContentLists',
  featuredLandlords: 'Featured Landlords',
  justForYou: 'Just For You',
  justForYouDescription: `Content curated for
you based on your likes, reposts, and follows. Refreshes often so if you like a digital_content, favorite it.`,
  moodContentLists: 'ContentLists to Fit Your Mood',
  moodContentListsDescription:
    'ContentLists made by Coliving users, sorted by mood and feel.'
}

const lifestyle = [
  CHILL_CONTENT_LISTS,
  UPBEAT_CONTENT_LISTS,
  INTENSE_CONTENT_LISTS,
  PROVOKING_CONTENT_LISTS,
  INTIMATE_CONTENT_LISTS
]

const TabBodyHeader = ({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children?: ReactNode
}) => {
  return (
    <div className={styles.tabBodyHeader}>
      <div className={styles.headerWrapper}>
        <div className={styles.title}>{title}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      {children && <div className={styles.children}>{children}</div>}
    </div>
  )
}

const tabHeaders = [
  { icon: <IconForYou />, text: messages.forYou, label: ExploreTabs.FOR_YOU },
  { icon: <IconMoods />, text: messages.moods, label: ExploreTabs.MOODS },
  {
    icon: <IconNote />,
    text: messages.contentLists,
    label: ExploreTabs.CONTENT_LISTS
  },
  { icon: <IconUser />, text: messages.landlords, label: ExploreTabs.PROFILES }
]

export type ExplorePageProps = {
  title: string
  description: string
  contentLists: UserCollection[]
  profiles: User[]
  status: Status
  formatContentListCardSecondaryText: (saves: number, agreements: number) => string
  formatProfileCardSecondaryText: (followerCount: number) => string
  goToRoute: (route: string) => void
}

const ExplorePage = ({
  title,
  description,
  contentLists,
  profiles,
  status,
  formatContentListCardSecondaryText,
  formatProfileCardSecondaryText,
  goToRoute
}: ExplorePageProps) => {
  useMainPageHeader()

  const justForYouTiles = justForYou.map(
    (t: SmartCollection | ExploreCollection) => {
      const Icon = t.icon ? t.icon : Fragment
      if (t.variant === CollectionVariant.SMART) {
        return (
          <ColorTile
            key={t.content_list_name}
            title={t.content_list_name}
            link={t.link}
            description={t.description}
            gradient={t.gradient}
            shadow={t.shadow}
            // @ts-ignore
            icon={<Icon />}
            goToRoute={goToRoute}
          />
        )
      } else {
        return (
          <ColorTile
            key={t.title}
            title={t.title}
            link={t.link}
            description={t.subtitle}
            gradient={t.gradient}
            shadow={t.shadow}
            // @ts-ignore
            icon={<Icon />}
            goToRoute={goToRoute}
            isIncentivized={t.incentivized}
          />
        )
      }
    }
  )

  const lifestyleTiles = lifestyle.map((t: ExploreMoodCollection) => {
    return (
      <ColorTile
        key={t.title}
        title={t.title}
        link={t.link}
        description={t.subtitle}
        gradient={t.gradient}
        shadow={t.shadow}
        emoji={
          t.variant === ExploreCollectionsVariant.MOOD ? t.emoji : undefined
        }
        goToRoute={goToRoute}
      />
    )
  })

  let contentListCards: JSX.Element[]
  let profileCards: JSX.Element[]
  if (status === Status.LOADING) {
    contentListCards = []
    profileCards = []
  } else {
    contentListCards = contentLists.map((contentList: UserCollection) => {
      return (
        <Card
          key={contentList.content_list_id}
          id={contentList.content_list_id}
          userId={contentList.content_list_owner_id}
          imageSize={contentList._cover_art_sizes}
          primaryText={contentList.content_list_name}
          secondaryText={formatContentListCardSecondaryText(
            contentList.save_count,
            contentList.content_list_contents.digital_content_ids.length
          )}
          onClick={() =>
            contentList.is_album
              ? goToRoute(
                  albumPage(
                    contentList.user.handle,
                    contentList.content_list_name,
                    contentList.content_list_id
                  )
                )
              : goToRoute(
                  contentListPage(
                    contentList.user.handle,
                    contentList.content_list_name,
                    contentList.content_list_id
                  )
                )
          }
        />
      )
    })
    profileCards = profiles.map((profile: User) => {
      return (
        <Card
          key={profile.user_id}
          id={profile.user_id}
          userId={profile.user_id}
          imageSize={profile._profile_picture_sizes}
          isUser
          primaryText={profile.name}
          secondaryText={formatProfileCardSecondaryText(profile.follower_count)}
          onClick={() => goToRoute(profilePage(profile.handle))}
        />
      )
    })
  }

  const memoizedElements = useMemo(() => {
    return [
      <TabBodyHeader
        key='justForYou'
        title={messages.justForYou}
        description={messages.justForYouDescription}
      >
        <div className={cn(styles.section, styles.tripleHeaderSectionTenTile)}>
          {justForYouTiles}
        </div>
      </TabBodyHeader>,
      <TabBodyHeader
        key='moodContentLists'
        title={messages.moodContentLists}
        description={messages.moodContentListsDescription}
      >
        <div className={styles.section}>{lifestyleTiles}</div>
      </TabBodyHeader>,
      <TabBodyHeader key='featuredContentLists' title={messages.featuredContentLists}>
        {status === Status.LOADING ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <CardLineup
            containerClassName={styles.lineupContainer}
            cardsClassName={styles.cardLineup}
            cards={contentListCards}
          />
        )}
      </TabBodyHeader>,
      <TabBodyHeader key='featuredLandlords' title={messages.featuredLandlords}>
        {status === Status.LOADING ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <CardLineup
            containerClassName={styles.lineupContainer}
            cardsClassName={styles.cardLineup}
            cards={profileCards}
          />
        )}
      </TabBodyHeader>
    ]
  }, [contentListCards, profileCards, justForYouTiles, lifestyleTiles, status])

  const initialTab = useSelector(getTab)
  const dispatch = useDispatch()
  const didSwitchTabs = useCallback(
    (_: string, to: string) => {
      dispatch(setTab({ tab: to as ExploreTabs }))
    },
    [dispatch]
  )
  const { tabs, body } = useTabs({
    tabs: tabHeaders,
    elements: memoizedElements,
    initialTab,
    didChangeTabsFrom: didSwitchTabs
  })

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header className={styles.header} title={messages.pageName} />
        <div className={styles.tabBar}>{tabs}</div>
      </>
    )
  }, [setHeader, tabs])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
    >
      <div className={styles.tabContainer}>
        <div className={styles.pageContainer}>{body}</div>
      </div>
    </MobilePageContainer>
  )
}

export default ExplorePage
