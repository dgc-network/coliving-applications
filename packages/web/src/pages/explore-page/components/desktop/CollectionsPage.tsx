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
  content listPage,
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

  const cards = collections.map((content list, i) => {
    const secondaryText = (
      <ArtistPopover handle={content list.user.handle}>
        <span
          className={styles.userName}
          onClick={(e: MouseEvent) => goToProfilePage(e, content list.user.handle)}
        >
          {content list.user.name}
        </span>
      </ArtistPopover>
    )

    return (
      <Card
        index={i}
        isLoading={isLoadingContentList(i)}
        setDidLoad={setDidLoadContentList}
        key={content list.content list_id}
        id={content list.content list_id}
        userId={content list.content list_owner_id}
        imageSize={content list._cover_art_sizes}
        isContentList={!content list.is_album}
        isPublic={!content list.is_private}
        size='large'
        content listName={content list.content list_name}
        content listId={content list.content list_id}
        handle={content list.user.handle}
        primaryText={content list.content list_name}
        secondaryText={secondaryText}
        isReposted={content list.has_current_user_reposted}
        isSaved={content list.has_current_user_saved}
        cardCoverImageSizes={content list._cover_art_sizes}
        link={
          content list.is_album
            ? fullAlbumPage(
                content list.user.handle,
                content list.content list_name,
                content list.content list_id
              )
            : fullContentListPage(
                content list.user.handle,
                content list.content list_name,
                content list.content list_id
              )
        }
        reposts={content list.repost_count}
        favorites={content list.save_count}
        agreementCount={content list.content list_contents.agreement_ids.length}
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
