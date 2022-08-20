import { useCallback, MouseEvent } from 'react'

import { ID, UserCollection, Status } from '@coliving/common'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import Card from 'components/card/desktop/Card'
import Header from 'components/header/desktop/Header'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import { useOrderedLoad } from 'hooks/useOrderedLoad'
import {
  contentListPage,
  fullContentListPage,
  albumPage,
  fullAlbumPage,
  BASE_URL,
  EXPLORE_PAGE,
  profilePage
} from 'utils/route'

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

const CollectionsPage = ({
  title,
  description,
  collections,
  status,
  onClickReposts,
  onClickFavorites,
  goToRoute
}: CollectionsPageProps) => {
  const { isLoading: isLoadingContentList, setDidLoad: setDidLoadContentList } =
    useOrderedLoad(collections.length)

  const goToProfilePage = useCallback(
    (e: MouseEvent, handle: string) => {
      e.stopPropagation()
      goToRoute(profilePage(handle))
    },
    [goToRoute]
  )

  const header = (
    <Header
      primary={title}
      secondary={description}
      containerStyles={description ? styles.header : null}
      wrapperClassName={description ? styles.headerWrapper : null}
    />
  )

  const cards = collections.map((contentList, i) => {
    const secondaryText = (
      <ArtistPopover handle={contentList.user.handle}>
        <span
          className={styles.userName}
          onClick={(e: MouseEvent) => goToProfilePage(e, contentList.user.handle)}
        >
          {contentList.user.name}
        </span>
      </ArtistPopover>
    )

    return (
      <Card
        index={i}
        isLoading={isLoadingContentList(i)}
        setDidLoad={setDidLoadContentList}
        key={contentList.contentList_id}
        id={contentList.contentList_id}
        userId={contentList.contentList_owner_id}
        imageSize={contentList._cover_art_sizes}
        isContentList={!contentList.is_album}
        isPublic={!contentList.is_private}
        size='large'
        contentListName={contentList.contentList_name}
        contentListId={contentList.contentList_id}
        handle={contentList.user.handle}
        primaryText={contentList.contentList_name}
        secondaryText={secondaryText}
        isReposted={contentList.has_current_user_reposted}
        isSaved={contentList.has_current_user_saved}
        cardCoverImageSizes={contentList._cover_art_sizes}
        link={
          contentList.is_album
            ? fullAlbumPage(
                contentList.user.handle,
                contentList.contentList_name,
                contentList.contentList_id
              )
            : fullContentListPage(
                contentList.user.handle,
                contentList.contentList_name,
                contentList.contentList_id
              )
        }
        reposts={contentList.repost_count}
        favorites={contentList.save_count}
        agreementCount={contentList.contentList_contents.agreement_ids.length}
        onClickReposts={() => onClickReposts(contentList.contentList_id)}
        onClickFavorites={() => onClickFavorites(contentList.contentList_id)}
        onClick={() =>
          contentList.is_album
            ? goToRoute(
                albumPage(
                  contentList.user.handle,
                  contentList.contentList_name,
                  contentList.contentList_id
                )
              )
            : goToRoute(
                contentListPage(
                  contentList.user.handle,
                  contentList.contentList_name,
                  contentList.contentList_id
                )
              )
        }
      />
    )
  })

  return (
    <Page
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
      contentClassName={styles.page}
      header={header}
    >
      {status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <CardLineup cards={cards} cardsClassName={styles.cardsContainer} />
      )}
    </Page>
  )
}

export default CollectionsPage
