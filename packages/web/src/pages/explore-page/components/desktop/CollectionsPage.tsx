import { useCallback, MouseEvent } from 'react'

import { ID, UserCollection, Status } from '@coliving/common'

import { LandlordPopover } from 'components/landlord/LandlordPopover'
import Card from 'components/card/desktop/card'
import Header from 'components/header/desktop/header'
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
      <LandlordPopover handle={contentList.user.handle}>
        <span
          className={styles.userName}
          onClick={(e: MouseEvent) => goToProfilePage(e, contentList.user.handle)}
        >
          {contentList.user.name}
        </span>
      </LandlordPopover>
    )

    return (
      <Card
        index={i}
        isLoading={isLoadingContentList(i)}
        setDidLoad={setDidLoadContentList}
        key={contentList.content_list_id}
        id={contentList.content_list_id}
        userId={contentList.content_list_owner_id}
        imageSize={contentList._cover_art_sizes}
        isContentList={!contentList.is_album}
        isPublic={!contentList.is_private}
        size='large'
        contentListName={contentList.content_list_name}
        contentListId={contentList.content_list_id}
        handle={contentList.user.handle}
        primaryText={contentList.content_list_name}
        secondaryText={secondaryText}
        isReposted={contentList.has_current_user_reposted}
        isSaved={contentList.has_current_user_saved}
        cardCoverImageSizes={contentList._cover_art_sizes}
        link={
          contentList.is_album
            ? fullAlbumPage(
                contentList.user.handle,
                contentList.content_list_name,
                contentList.content_list_id
              )
            : fullContentListPage(
                contentList.user.handle,
                contentList.content_list_name,
                contentList.content_list_id
              )
        }
        reposts={contentList.repost_count}
        favorites={contentList.save_count}
        agreementCount={contentList.content_list_contents.agreement_ids.length}
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
