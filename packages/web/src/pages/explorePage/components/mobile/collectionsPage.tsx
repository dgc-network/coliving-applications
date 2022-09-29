import { useContext, useEffect } from 'react'

import { ID, UserCollection, Status } from '@coliving/common'

import Card from 'components/card/mobile/card'
import Header from 'components/header/mobile/header'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import CardLineup from 'components/lineup/cardLineup'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import { useSubPageHeader } from 'components/nav/store/context'
import { contentListPage, albumPage, BASE_URL, EXPLORE_PAGE } from 'utils/route'

import styles from './CollectionsPage.module.css'

export type CollectionsPageProps = {
  title: string
  description: string
  collections: UserCollection[]
  status: Status
  onClickReposts: (id: ID) => void
  onClickFavorites: (id: ID) => void
  goToRoute: (route: string) => void
}

const ExplorePage = ({
  title,
  description,
  collections,
  status,
  onClickReposts,
  onClickFavorites,
  goToRoute
}: CollectionsPageProps) => {
  useSubPageHeader()

  const contentListCards = collections.map((contentList: UserCollection) => {
    return (
      <Card
        key={contentList.content_list_id}
        id={contentList.content_list_id}
        userId={contentList.content_list_owner_id}
        imageSize={contentList._cover_art_sizes}
        primaryText={contentList.content_list_name}
        secondaryText={contentList.user.name}
        agreementCount={contentList.content_list_contents.agreement_ids.length}
        reposts={contentList.repost_count}
        favorites={contentList.save_count}
        isContentList={!contentList.is_album}
        onClickReposts={() => onClickReposts(contentList.content_list_id)}
        onClickFavorites={() => onClickFavorites(contentList.content_list_id)}
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

  const cards = (
    <CardLineup
      containerClassName={styles.lineupContainer}
      cardsClassName={styles.cardLineup}
      cards={contentListCards}
    />
  )

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header className={styles.header} title={title} />
      </>
    )
  }, [setHeader, title])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
      containerClassName={styles.pageContainer}
      hasDefaultHeader
    >
      {status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        cards
      )}
    </MobilePageContainer>
  )
}

export default ExplorePage
