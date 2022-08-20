import { useContext, useEffect } from 'react'

import { ID, UserCollection, Status } from '@coliving/common'

import Card from 'components/card/mobile/Card'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useSubPageHeader } from 'components/nav/store/context'
import { content listPage, albumPage, BASE_URL, EXPLORE_PAGE } from 'utils/route'

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

  const content listCards = collections.map((content list: UserCollection) => {
    return (
      <Card
        key={content list.content list_id}
        id={content list.content list_id}
        userId={content list.content list_owner_id}
        imageSize={content list._cover_art_sizes}
        primaryText={content list.content list_name}
        secondaryText={content list.user.name}
        agreementCount={content list.content list_contents.agreement_ids.length}
        reposts={content list.repost_count}
        favorites={content list.save_count}
        isContentList={!content list.is_album}
        onClickReposts={() => onClickReposts(content list.content list_id)}
        onClickFavorites={() => onClickFavorites(content list.content list_id)}
        onClick={() =>
          content list.is_album
            ? goToRoute(
                albumPage(
                  content list.user.handle,
                  content list.content list_name,
                  content list.content list_id
                )
              )
            : goToRoute(
                content listPage(
                  content list.user.handle,
                  content list.content list_name,
                  content list.content list_id
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
      cards={content listCards}
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
