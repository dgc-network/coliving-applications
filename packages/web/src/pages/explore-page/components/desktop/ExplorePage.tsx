import { Fragment, useCallback } from 'react'

import {
  UserCollection,
  Variant as CollectionVariant,
  Status,
  User
} from '@coliving/common'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { ExploreCollectionsVariant } from 'common/store/pages/explore/types'
import CollectionArtCard from 'components/card/desktop/collectionArtCard'
import UserArtCard from 'components/card/desktop/userArtCard'
import Header from 'components/header/desktop/header'
import Page from 'components/page/Page'
import PerspectiveCard, {
  TextInterior,
  EmojiInterior
} from 'components/perspective-card/PerspectiveCard'
import { useOrderedLoad } from 'hooks/useOrderedLoad'
import {
  LET_THEM_DJ,
  TOP_ALBUMS,
  TRENDING_CONTENT_LISTS,
  TRENDING_UNDERGROUND,
  CHILL_CONTENT_LISTS,
  UPBEAT_CONTENT_LISTS,
  INTENSE_CONTENT_LISTS,
  PROVOKING_CONTENT_LISTS,
  INTIMATE_CONTENT_LISTS
} from 'pages/explore-page/collections'
import {
  HEAVY_ROTATION,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  MOST_LOVED,
  REMIXABLES,
  FEELING_LUCKY
} from 'pages/smart-collection/smartCollections'
import { BASE_URL, EXPLORE_PAGE, stripBaseUrl } from 'utils/route'

import styles from './ExplorePage.module.css'
import Section, { Layout } from './Section'

const messages = {
  featuredContentLists: 'ContentLists We Love Right Now',
  featuredProfiles: 'Landlords You Should Follow',
  exploreMoreContentLists: 'Explore More ContentLists',
  exploreMoreProfiles: 'Explore More Landlords',
  justForYou: 'Just For You',
  justForYouSubtitle: `Content curated for you based on your likes,
reposts, and follows. Refreshes often so if you like a agreement, favorite it.`,
  lifestyle: 'ContentLists to Fit Your Mood',
  lifestyleSubtitle: 'ContentLists made by Coliving users, sorted by mood and feel'
}

export const justForYou = [
  TRENDING_CONTENT_LISTS,
  TRENDING_UNDERGROUND,
  HEAVY_ROTATION,
  LET_THEM_DJ,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  TOP_ALBUMS,
  REMIXABLES,
  MOST_LOVED,
  FEELING_LUCKY
]

const lifestyle = [
  CHILL_CONTENT_LISTS,
  UPBEAT_CONTENT_LISTS,
  INTENSE_CONTENT_LISTS,
  PROVOKING_CONTENT_LISTS,
  INTIMATE_CONTENT_LISTS
]

export type ExplorePageProps = {
  title: string
  description: string
  contentLists: UserCollection[]
  profiles: User[]
  status: Status
  goToRoute: (route: string) => void
}

const ExplorePage = ({
  title,
  description,
  contentLists,
  profiles,
  status,
  goToRoute
}: ExplorePageProps) => {
  const { isLoading: isLoadingContentList, setDidLoad: setDidLoadContentList } =
    useOrderedLoad(contentLists.length)
  const { isLoading: isLoadingProfiles, setDidLoad: setDidLoadProfile } =
    useOrderedLoad(profiles.length)

  const header = <Header primary={title} containerStyles={styles.header} />
  const onClickCard = useCallback(
    (url: string) => {
      if (url.startsWith(BASE_URL)) {
        goToRoute(stripBaseUrl(url))
      } else if (url.startsWith('http')) {
        const win = window.open(url, '_blank')
        if (win) win.focus()
      } else {
        goToRoute(url)
      }
    },
    [goToRoute]
  )

  return (
    <Page
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
      contentClassName={styles.page}
      header={header}
    >
      <Section
        title={messages.justForYou}
        subtitle={messages.justForYouSubtitle}
        layout={Layout.TWO_COLUMN_DYNAMIC_WITH_DOUBLE_LEADING_ELEMENT}
      >
        {justForYou.map((i) => {
          const title =
            i.variant === CollectionVariant.SMART ? i.content_list_name : i.title
          const subtitle =
            i.variant === CollectionVariant.SMART ? i.description : i.subtitle
          const Icon = i.icon ? i.icon : Fragment
          return (
            <PerspectiveCard
              key={title}
              backgroundGradient={i.gradient}
              shadowColor={i.shadow}
              useOverlayBlendMode={
                i.variant !== ExploreCollectionsVariant.DIRECT_LINK
              }
              // @ts-ignore
              backgroundIcon={<Icon />}
              onClick={() => onClickCard(i.link)}
              isIncentivized={!!i.incentivized}
              sensitivity={i.cardSensitivity}
            >
              <TextInterior title={title} subtitle={subtitle} />
            </PerspectiveCard>
          )
        })}
      </Section>

      <Section title={messages.lifestyle} subtitle={messages.lifestyleSubtitle}>
        {lifestyle.map((i) => (
          <PerspectiveCard
            key={i.title}
            backgroundGradient={i.gradient}
            shadowColor={i.shadow}
            onClick={() => goToRoute(i.link)}
          >
            <EmojiInterior title={i.title} emoji={i.emoji} />
          </PerspectiveCard>
        ))}
      </Section>

      <Section
        title={messages.featuredContentLists}
        expandable
        expandText={messages.exploreMoreContentLists}
      >
        {status === Status.LOADING ? (
          <div className={styles.loadingSpinner}>
            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: loadingSpinner
              }}
            />
          </div>
        ) : (
          contentLists.map((contentList: UserCollection, i: number) => {
            return (
              <CollectionArtCard
                key={contentList.content_list_id}
                id={contentList.content_list_id}
                index={i}
                isLoading={isLoadingContentList(i)}
                setDidLoad={setDidLoadContentList}
              />
            )
          })
        )}
      </Section>

      <Section
        title={messages.featuredProfiles}
        expandable
        expandText={messages.exploreMoreProfiles}
      >
        {status === Status.LOADING ? (
          <div className={styles.loadingSpinner}>
            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: loadingSpinner
              }}
            />
          </div>
        ) : (
          profiles.map((profile: User, i: number) => {
            return (
              <UserArtCard
                key={profile.user_id}
                id={profile.user_id}
                index={i}
                isLoading={isLoadingProfiles(i)}
                setDidLoad={setDidLoadProfile}
              />
            )
          })
        )}
      </Section>
    </Page>
  )
}

export default ExplorePage
