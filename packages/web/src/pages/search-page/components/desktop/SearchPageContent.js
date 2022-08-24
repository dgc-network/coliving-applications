import { Component } from 'react'

import { Status } from '@coliving/common'
import { Redirect } from 'react-router'

import { ReactComponent as IconBigSearch } from 'assets/img/iconBigSearch.svg'
import { agreementsActions } from 'common/store/pages/search-results/lineup/agreements/actions'
import { formatCount } from 'common/utils/formatUtil'
import Card from 'components/card/desktop/Card'
import CategoryHeader from 'components/header/desktop/CategoryHeader'
import Header from 'components/header/desktop/Header'
import CardLineup from 'components/lineup/CardLineup'
import Lineup from 'components/lineup/Lineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import Toast from 'components/toast/Toast'
import {
  albumPage,
  fullAlbumPage,
  contentListPage,
  fullContentListPage,
  profilePage,
  fullSearchResultsPage,
  NOT_FOUND_PAGE
} from 'utils/route'

import styles from './SearchPageContent.module.css'

const SEARCH_HEADER_MAX_WIDTH_PX = 720

const SearchHeader = (props) => {
  const secondary = (
    <span className={styles.searchText}>&#8220;{props.searchText}&#8221;</span>
  )
  return (
    <Header
      {...props}
      primary={props.title}
      secondary={secondary}
      overrideWidth={SEARCH_HEADER_MAX_WIDTH_PX}
      variant='main'
      containerStyles={styles.searchResultsHeader}
    />
  )
}

class SearchPageContent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      cardToast: {}
    }
  }

  componentWillUnmount() {
    Object.keys(this.state.cardToast).forEach((toastId) =>
      this.clearCardToast(toastId)
    )
  }

  onShare = (category, id) => () => {
    const toastId = `${category}-${id}`
    this.setState({
      cardToast: {
        ...this.state.cardToast,
        [toastId]: {
          open: true,
          message: 'Copied to Clipboard!',
          timeout: setTimeout(this.clearCardToast(toastId), 2000)
        }
      }
    })
  }

  onRepost = (category, id, metadata) => () => {
    const toastId = `${category}-${id}`
    if (this.state.cardToast[toastId]) {
      clearTimeout(this.state.cardToast[toastId].timeout)
    }
    this.setState({
      cardToast: {
        ...this.state.cardToast,
        [toastId]: {
          open: true,
          message: 'Reposted!',
          timeout: setTimeout(this.clearCardToast(toastId), 2000)
        }
      }
    })
  }

  clearCardToast = (toastId) => () => {
    const cardToast = this.state.cardToast[toastId]
    clearTimeout(cardToast.timeout)
    this.setState({
      cardToast: {
        ...this.state.cardToast,
        [toastId]: {
          ...cardToast,
          open: false
        }
      }
    })
  }

  render() {
    const {
      userId,
      agreements,
      currentQueueItem,
      playing,
      buffering,
      landlords,
      contentLists,
      albums,
      goToRoute,
      handleViewMoreResults,
      searchResultsCategory,
      isTagSearch,
      searchText,
      search: { status },
      recordSearchResultClick
    } = this.props
    const { cardToast } = this.state
    const searchTitle = isTagSearch ? `Tag Search` : `Search`
    const landlordCards = landlords.map((landlord, ind) => {
      const toastId = `user-${landlord.user_id}`
      const onClick = () => {
        goToRoute(profilePage(landlord.handle))
        recordSearchResultClick({
          term: searchText,
          kind: 'profile',
          id: landlord.user_id,
          source:
            searchResultsCategory === 'all'
              ? 'search results page'
              : 'more results page'
        })
      }
      return (
        <Toast
          key={landlord.user_id}
          text={cardToast[toastId] && cardToast[toastId].message}
          open={cardToast[toastId] && cardToast[toastId].open}
          placement='bottom'
          fillParent={false}
        >
          <Card
            id={landlord.user_id}
            userId={landlord.user_id}
            imageSize={landlord._profile_picture_sizes}
            isUser
            size={'small'}
            primaryText={landlord.name}
            secondaryText={`${formatCount(landlord.follower_count)} Followers`}
            onClick={onClick}
            menu={{
              type: 'user',
              handle: landlord.handle,
              userId: landlord.user_id,
              currentUserFollows: landlord.does_current_user_follow,
              onShare: this.onShare('user', landlord.user_id)
            }}
          />
        </Toast>
      )
    })

    const contentListCards = contentLists.map((contentList, ind) => {
      const toastId = `content-list-${contentList.content_list_id}`
      const onClick = () => {
        goToRoute(
          contentListPage(
            contentList.user.handle,
            contentList.content_list_name,
            contentList.content_list_id
          )
        )
        recordSearchResultClick({
          term: searchText,
          kind: 'contentList',
          id: contentList.content_list_id,
          source:
            searchResultsCategory === 'all'
              ? 'search results page'
              : 'more results page'
        })
      }
      return (
        // TODO: Refactor cards and the way draggable wraps them.
        <Toast
          key={contentList.content_list_id}
          text={cardToast[toastId] && cardToast[toastId].message}
          open={cardToast[toastId] && cardToast[toastId].open}
          placement='bottom'
          fillParent={false}
          contentListId={contentList.content_list_id}
          isAlbum={contentList.is_album}
          link={fullContentListPage(
            contentList.user.handle,
            contentList.content_list_name,
            contentList.content_list_id
          )}
          primaryText={contentList.content_list_name}
        >
          <Card
            size={'small'}
            id={contentList.content_list_id}
            imageSize={contentList._cover_art_sizes}
            primaryText={contentList.content_list_name}
            secondaryText={`${contentList.user.name} • ${
              contentList.agreementCount
            } Agreement${contentList.agreementCount > 1 ? 's' : ''}`}
            onClick={onClick}
            menu={{
              type: 'contentList',
              handle: contentList.user.handle,
              name: contentList.content_list_name,
              isOwner: contentList.user.user_id === userId,
              contentListId: contentList.content_list_id,
              currentUserSaved: contentList.has_current_user_saved,
              currentUserReposted: contentList.has_current_user_reposted,
              metadata: contentList,
              includeShare: true,
              includeRepost: true,
              isPublic: !contentList.is_private,
              onShare: this.onShare('contentList', contentList.content_list_id),
              onRepost: this.onRepost('contentList', contentList.content_list_id)
            }}
          />
        </Toast>
      )
    })

    const albumCards = albums.map((album, ind) => {
      const toastId = `album-${album.content_list_id}`
      const onClick = () => {
        goToRoute(
          albumPage(album.user.handle, album.content_list_name, album.content_list_id)
        )
        recordSearchResultClick({
          term: searchText,
          kind: 'album',
          id: album.content_list_id,
          source:
            searchResultsCategory === 'all'
              ? 'search results page'
              : 'more results page'
        })
      }
      return (
        // TODO: Refactor cards and the way draggable wraps them.
        <Toast
          key={album.content_list_id}
          text={cardToast[toastId] && cardToast[toastId].message}
          open={cardToast[toastId] && cardToast[toastId].open}
          placement='bottom'
          fillParent={false}
          contentListId={album.content_list_id}
          isAlbum={album.is_album}
          link={fullAlbumPage(
            album.user.handle,
            album.content_list_name,
            album.content_list_id
          )}
          primaryText={album.content_list_name}
        >
          <Card
            size={'small'}
            id={album.content_list_id}
            imageSize={album._cover_art_sizes}
            primaryText={album.content_list_name}
            secondaryText={album.user.name}
            onClick={onClick}
            menu={{
              type: 'album',
              handle: album.user.handle,
              name: album.content_list_name,
              contentListId: album.content_list_id,
              isOwner: album.user.user_id === userId,
              metadata: album,
              isPublic: !album.is_private,
              currentUserSaved: album.has_current_user_saved,
              currentUserReposted: album.has_current_user_reposted,
              includeShare: true,
              includeRepost: true,
              onShare: this.onShare('album', album.content_list_id),
              onRepost: this.onRepost('album', album.content_list_id)
            }}
          />
        </Toast>
      )
    })

    const foundResults =
      landlordCards.length > 0 ||
      agreements.entries.length > 0 ||
      contentListCards.length > 0 ||
      albumCards.length > 0
    let content
    let header
    if (searchResultsCategory === 'users') {
      content = (
        <CardLineup
          categoryName={'Profiles'}
          cards={landlordCards}
          containerClassName={styles.landlordSearchResultsContainer}
          cardsClassName={styles.cardsContainer}
        />
      )
      header = <SearchHeader searchText={searchText} title={searchTitle} />
    } else if (searchResultsCategory === 'agreements') {
      content = (
        <>
          <div className={styles.agreementSearchResultsContainer}>
            <CategoryHeader categoryName='Agreements' />
            <Lineup
              search
              key='searchAgreements'
              selfLoad
              variant='section'
              lineup={agreements}
              playingSource={currentQueueItem.source}
              playingUid={currentQueueItem.uid}
              playingAgreementId={
                currentQueueItem.agreement && currentQueueItem.agreement.agreement_id
              }
              playing={playing}
              buffering={buffering}
              scrollParent={this.props.containerRef}
              loadMore={(offset, limit) =>
                this.props.dispatch(
                  agreementsActions.fetchLineupMetadatas(offset, limit)
                )
              }
              playAgreement={(uid) => this.props.dispatch(agreementsActions.play(uid))}
              pauseAgreement={() => this.props.dispatch(agreementsActions.pause())}
              actions={agreementsActions}
            />
          </div>
        </>
      )
      header = <SearchHeader searchText={searchText} title={searchTitle} />
    } else if (searchResultsCategory === 'contentLists') {
      content = isTagSearch ? (
        <Redirect to={NOT_FOUND_PAGE} />
      ) : (
        <>
          <CardLineup
            categoryName={'ContentLists'}
            cards={contentListCards}
            containerClassName={styles.contentListSearchResultsContainer}
            cardsClassName={styles.cardsContainer}
          />
        </>
      )
      header = <SearchHeader searchText={searchText} title={searchTitle} />
    } else if (searchResultsCategory === 'albums') {
      content = isTagSearch ? (
        <Redirect to={NOT_FOUND_PAGE} />
      ) : (
        <>
          <CardLineup
            categoryName={'Albums'}
            cards={albumCards}
            containerClassName={styles.albumSearchResultsContainer}
            cardsClassName={styles.cardsContainer}
          />
        </>
      )
      header = <SearchHeader searchText={searchText} title={searchTitle} />
    } else if (foundResults) {
      header = <SearchHeader searchText={searchText} title={searchTitle} />
      content = (
        <>
          {landlordCards.length > 0 ? (
            <CardLineup
              categoryName={'Profiles'}
              onMore={
                landlordCards.length >= 4
                  ? handleViewMoreResults('profiles')
                  : null
              }
              cards={landlordCards.slice(0, Math.min(4, landlordCards.length))}
              containerClassName={styles.landlordSearchResultsContainer}
              cardsClassName={styles.cardsContainer}
            />
          ) : null}
          {agreements.entries.length > 0 ? (
            <div className={styles.agreementSearchResultsContainer}>
              <CategoryHeader
                categoryName='Agreements'
                onMore={handleViewMoreResults('agreements')}
              />
              <Lineup
                search
                variant='section'
                count={4}
                selfLoad={false}
                lineup={agreements}
                playingSource={currentQueueItem.source}
                playingUid={currentQueueItem.uid}
                playingAgreementId={
                  currentQueueItem.agreement && currentQueueItem.agreement.agreement_id
                }
                playing={playing}
                buffering={buffering}
                scrollParent={this.props.containerRef}
                onMore={
                  agreements.entries.length >= 4
                    ? handleViewMoreResults('agreements')
                    : null
                }
                loadMore={(offset, limit) =>
                  this.props.dispatch(
                    agreementsActions.fetchLineupMetadatas(offset, limit)
                  )
                }
                playAgreement={(uid) =>
                  this.props.dispatch(agreementsActions.play(uid))
                }
                pauseAgreement={(uid) => this.props.dispatch(agreementsActions.pause())}
                actions={agreementsActions}
              />
            </div>
          ) : null}
          {!isTagSearch && contentListCards.length > 0 ? (
            <CardLineup
              categoryName={'ContentLists'}
              onMore={
                contentListCards.length >= 4
                  ? handleViewMoreResults('contentLists')
                  : null
              }
              cards={contentListCards.slice(0, Math.min(4, contentListCards.length))}
              containerClassName={styles.contentListSearchResultsContainer}
              cardsClassName={styles.cardsContainer}
            />
          ) : null}
          {!isTagSearch && albumCards.length > 0 ? (
            <CardLineup
              categoryName={'Albums'}
              onMore={
                albumCards.length >= 4 ? handleViewMoreResults('albums') : null
              }
              cards={albumCards.slice(0, Math.min(4, albumCards.length))}
              containerClassName={styles.albumSearchResultsContainer}
              cardsClassName={styles.cardsContainer}
            />
          ) : null}
        </>
      )
    } else {
      const errorText = isTagSearch
        ? "Sorry, we couldn't find any tags that match"
        : "Sorry, we couldn't find anything that matches"
      header = <SearchHeader searchText={searchText} title={searchTitle} />
      content = (
        <>
          <div className={styles.noResults}>
            <IconBigSearch />
            <div className={styles.queryText}>{errorText}</div>
            <div className={styles.queryText}>&#8220;{searchText}&#8221;</div>
            <div className={styles.helperText}>
              {`Please check your spelling or try broadening your search.`}
            </div>
          </div>
        </>
      )
    }

    return (
      <Page
        title={`${searchTitle} ${searchText}`}
        description={`Search results for ${searchText}`}
        canonicalUrl={fullSearchResultsPage(searchText)}
        contentClassName={styles.searchResults}
        header={header}
      >
        {status === Status.ERROR ? (
          <p>Oh no! Something went wrong!</p>
        ) : status === Status.LOADING ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          content
        )}
      </Page>
    )
  }
}

export default SearchPageContent
