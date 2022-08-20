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
  content listPage,
  fullPlaylistPage,
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
      artists,
      content lists,
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
    const artistCards = artists.map((artist, ind) => {
      const toastId = `user-${artist.user_id}`
      const onClick = () => {
        goToRoute(profilePage(artist.handle))
        recordSearchResultClick({
          term: searchText,
          kind: 'profile',
          id: artist.user_id,
          source:
            searchResultsCategory === 'all'
              ? 'search results page'
              : 'more results page'
        })
      }
      return (
        <Toast
          key={artist.user_id}
          text={cardToast[toastId] && cardToast[toastId].message}
          open={cardToast[toastId] && cardToast[toastId].open}
          placement='bottom'
          fillParent={false}
        >
          <Card
            id={artist.user_id}
            userId={artist.user_id}
            imageSize={artist._profile_picture_sizes}
            isUser
            size={'small'}
            primaryText={artist.name}
            secondaryText={`${formatCount(artist.follower_count)} Followers`}
            onClick={onClick}
            menu={{
              type: 'user',
              handle: artist.handle,
              userId: artist.user_id,
              currentUserFollows: artist.does_current_user_follow,
              onShare: this.onShare('user', artist.user_id)
            }}
          />
        </Toast>
      )
    })

    const content listCards = content lists.map((content list, ind) => {
      const toastId = `content list-${content list.content list_id}`
      const onClick = () => {
        goToRoute(
          content listPage(
            content list.user.handle,
            content list.content list_name,
            content list.content list_id
          )
        )
        recordSearchResultClick({
          term: searchText,
          kind: 'content list',
          id: content list.content list_id,
          source:
            searchResultsCategory === 'all'
              ? 'search results page'
              : 'more results page'
        })
      }
      return (
        // TODO: Refactor cards and the way draggable wraps them.
        <Toast
          key={content list.content list_id}
          text={cardToast[toastId] && cardToast[toastId].message}
          open={cardToast[toastId] && cardToast[toastId].open}
          placement='bottom'
          fillParent={false}
          content listId={content list.content list_id}
          isAlbum={content list.is_album}
          link={fullPlaylistPage(
            content list.user.handle,
            content list.content list_name,
            content list.content list_id
          )}
          primaryText={content list.content list_name}
        >
          <Card
            size={'small'}
            id={content list.content list_id}
            imageSize={content list._cover_art_sizes}
            primaryText={content list.content list_name}
            secondaryText={`${content list.user.name} • ${
              content list.agreementCount
            } Agreement${content list.agreementCount > 1 ? 's' : ''}`}
            onClick={onClick}
            menu={{
              type: 'content list',
              handle: content list.user.handle,
              name: content list.content list_name,
              isOwner: content list.user.user_id === userId,
              content listId: content list.content list_id,
              currentUserSaved: content list.has_current_user_saved,
              currentUserReposted: content list.has_current_user_reposted,
              metadata: content list,
              includeShare: true,
              includeRepost: true,
              isPublic: !content list.is_private,
              onShare: this.onShare('content list', content list.content list_id),
              onRepost: this.onRepost('content list', content list.content list_id)
            }}
          />
        </Toast>
      )
    })

    const albumCards = albums.map((album, ind) => {
      const toastId = `album-${album.content list_id}`
      const onClick = () => {
        goToRoute(
          albumPage(album.user.handle, album.content list_name, album.content list_id)
        )
        recordSearchResultClick({
          term: searchText,
          kind: 'album',
          id: album.content list_id,
          source:
            searchResultsCategory === 'all'
              ? 'search results page'
              : 'more results page'
        })
      }
      return (
        // TODO: Refactor cards and the way draggable wraps them.
        <Toast
          key={album.content list_id}
          text={cardToast[toastId] && cardToast[toastId].message}
          open={cardToast[toastId] && cardToast[toastId].open}
          placement='bottom'
          fillParent={false}
          content listId={album.content list_id}
          isAlbum={album.is_album}
          link={fullAlbumPage(
            album.user.handle,
            album.content list_name,
            album.content list_id
          )}
          primaryText={album.content list_name}
        >
          <Card
            size={'small'}
            id={album.content list_id}
            imageSize={album._cover_art_sizes}
            primaryText={album.content list_name}
            secondaryText={album.user.name}
            onClick={onClick}
            menu={{
              type: 'album',
              handle: album.user.handle,
              name: album.content list_name,
              content listId: album.content list_id,
              isOwner: album.user.user_id === userId,
              metadata: album,
              isPublic: !album.is_private,
              currentUserSaved: album.has_current_user_saved,
              currentUserReposted: album.has_current_user_reposted,
              includeShare: true,
              includeRepost: true,
              onShare: this.onShare('album', album.content list_id),
              onRepost: this.onRepost('album', album.content list_id)
            }}
          />
        </Toast>
      )
    })

    const foundResults =
      artistCards.length > 0 ||
      agreements.entries.length > 0 ||
      content listCards.length > 0 ||
      albumCards.length > 0
    let content
    let header
    if (searchResultsCategory === 'users') {
      content = (
        <CardLineup
          categoryName={'Profiles'}
          cards={artistCards}
          containerClassName={styles.artistSearchResultsContainer}
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
    } else if (searchResultsCategory === 'content lists') {
      content = isTagSearch ? (
        <Redirect to={NOT_FOUND_PAGE} />
      ) : (
        <>
          <CardLineup
            categoryName={'Playlists'}
            cards={content listCards}
            containerClassName={styles.content listSearchResultsContainer}
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
          {artistCards.length > 0 ? (
            <CardLineup
              categoryName={'Profiles'}
              onMore={
                artistCards.length >= 4
                  ? handleViewMoreResults('profiles')
                  : null
              }
              cards={artistCards.slice(0, Math.min(4, artistCards.length))}
              containerClassName={styles.artistSearchResultsContainer}
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
          {!isTagSearch && content listCards.length > 0 ? (
            <CardLineup
              categoryName={'Playlists'}
              onMore={
                content listCards.length >= 4
                  ? handleViewMoreResults('content lists')
                  : null
              }
              cards={content listCards.slice(0, Math.min(4, content listCards.length))}
              containerClassName={styles.content listSearchResultsContainer}
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
