import { Component } from 'react'

import { Name, SquareSizes } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { has } from 'lodash'
import { connect } from 'react-redux'
import { matchPath } from 'react-router'
import { withRouter } from 'react-router-dom'

import placeholderArt from 'assets/img/imageBlank2x.png'
import profilePicEmpty from 'assets/img/imageProfilePicEmpty2X.png'
import { getTierForUser } from 'common/store/wallet/utils'
import { getSearch } from 'components/search-bar/store/selectors'
import Bar from 'components/search/SearchBar'
import { make } from 'store/analytics/actions'
import { albumPage, content listPage, profilePage, getPathname } from 'utils/route'

import styles from './ConnectedSearchBar.module.css'
import { fetchSearch, cancelFetchSearch, clearSearch } from './store/actions'

class ConnectedSearchBar extends Component {
  state = {
    value: ''
  }

  componentDidMount() {
    const { history } = this.props

    // Clear search when navigating away from the search results page.
    history.listen((location, action) => {
      const match = matchPath(getPathname(), {
        path: '/search/:query'
      })
      if (!match) {
        this.onSearchChange('')
      }
    })

    // Set the initial search bar value if we loaded into a search page.
    const match = matchPath(getPathname(), {
      path: '/search/:query'
    })
    if (has(match, 'params.query')) {
      this.onSearchChange(match.params.query)
    }
  }

  isTagSearch = () => this.state.value[0] === '#'

  onSearchChange = (value, fetch) => {
    if (value.trim().length === 0) {
      // If the user erases the entire search content, clear the search store
      // so that on the next search a new dataSource triggers animation of the dropdown.
      this.props.clearSearch()
      this.setState({ value: '' })
      return
    }

    // decodeURIComponent can fail with searches that include
    // a % sign (malformed URI), so wrap this in a try catch
    let decodedValue = value
    try {
      decodedValue = decodeURIComponent(value)
    } catch {}

    if (!this.isTagSearch() && fetch) {
      this.props.fetchSearch(decodedValue)
    }
    this.setState({ value: decodedValue })
  }

  onSubmit = (value) => {
    // Encode everything besides tag searches
    if (!value.startsWith('#')) {
      value = encodeURIComponent(value)
    }
    const pathname = `/search/${value}`
    this.props.history.push({
      pathname,
      state: {}
    })
  }

  onSelect = (value) => {
    const { id, kind } = (() => {
      const selectedUser = this.props.search.users.find(
        (u) => value === profilePage(u.handle)
      )
      if (selectedUser) return { kind: 'profile', id: selectedUser.user_id }
      const selectedAgreement = this.props.search.agreements.find(
        (t) => value === (t.user ? t.permalink : '')
      )
      if (selectedAgreement) return { kind: 'agreement', id: selectedAgreement.agreement_id }
      const selectedPlaylist = this.props.search.content lists.find(
        (p) =>
          value ===
          (p.user
            ? content listPage(p.user.handle, p.content list_name, p.content list_id)
            : '')
      )
      if (selectedPlaylist)
        return { kind: 'content list', id: selectedPlaylist.content list_id }
      const selectedAlbum = this.props.search.albums.find(
        (a) =>
          value ===
          (a.user
            ? albumPage(a.user.handle, a.content list_name, a.content list_id)
            : '')
      )
      if (selectedAlbum) return { kind: 'album', id: selectedAlbum.content list_id }
      return {}
    })()
    this.props.recordSearchResultClick({
      term: this.props.search.searchText,
      kind,
      id,
      source: 'autocomplete'
    })
  }

  render() {
    if (!this.props.search.agreements) {
      this.props.search.agreements = []
    }
    const dataSource = {
      sections: [
        {
          title: 'Profiles',
          children: this.props.search.users.map((user) => {
            return {
              key: profilePage(user.handle),
              primary: user.name || user.handle,
              userId: user.user_id,
              id: user.user_id,
              imageMultihash:
                user.profile_picture_sizes || user.profile_picture,
              size: user.profile_picture_sizes
                ? SquareSizes.SIZE_150_BY_150
                : null,
              contentNodeEndpoint: user.content_node_endpoint,
              defaultImage: profilePicEmpty,
              isVerifiedUser: user.is_verified,
              tier: getTierForUser(user)
            }
          })
        },
        {
          title: 'Agreements',
          children: this.props.search.agreements.map((agreement) => {
            return {
              key: agreement.user ? agreement.permalink : '',
              primary: agreement.title,
              secondary: agreement.user ? agreement.user.name : '',
              id: agreement.agreement_id,
              userId: agreement.owner_id,
              imageMultihash: agreement.cover_art_sizes || agreement.cover_art,
              size: agreement.cover_art_sizes ? SquareSizes.SIZE_150_BY_150 : null,
              contentNodeEndpoint: agreement.user
                ? agreement.user.content_node_endpoint
                : '',
              defaultImage: placeholderArt,
              isVerifiedUser: agreement.user.is_verified,
              tier: getTierForUser(agreement.user)
            }
          })
        },
        {
          title: 'Playlists',
          children: this.props.search.content lists.map((content list) => {
            return {
              primary: content list.content list_name,
              secondary: content list.user ? content list.user.name : '',
              key: content list.user
                ? content listPage(
                    content list.user.handle,
                    content list.content list_name,
                    content list.content list_id
                  )
                : '',
              id: content list.content list_id,
              userId: content list.content list_owner_id,
              imageMultihash: content list.cover_art_sizes || content list.cover_art,
              size: content list.cover_art_sizes
                ? SquareSizes.SIZE_150_BY_150
                : null,
              defaultImage: placeholderArt,
              contentNodeEndpoint: content list.user
                ? content list.user.content_node_endpoint
                : '',
              isVerifiedUser: content list.user.is_verified,
              tier: getTierForUser(content list.user)
            }
          })
        },
        {
          title: 'Albums',
          children: this.props.search.albums.map((album) => {
            return {
              key: album.user
                ? albumPage(
                    album.user.handle,
                    album.content list_name,
                    album.content list_id
                  )
                : '',
              primary: album.content list_name,
              secondary: album.user ? album.user.name : '',
              id: album.content list_id,
              userId: album.content list_owner_id,
              imageMultihash: album.cover_art_sizes || album.cover_art,
              size: album.cover_art_sizes ? SquareSizes.SIZE_150_BY_150 : null,
              defaultImage: placeholderArt,
              contentNodeEndpoint: album.user
                ? album.user.content_node_endpoint
                : '',
              isVerifiedUser: album.user.is_verified,
              tier: getTierForUser(album.user)
            }
          })
        }
      ]
    }
    const resultsCount = dataSource.sections.reduce(
      (count, section) => count + section.children.length,
      0
    )
    const { status, searchText } = this.props.search
    return (
      <div className={styles.search}>
        <Bar
          value={this.state.value}
          isTagSearch={this.isTagSearch()}
          status={status}
          searchText={searchText}
          dataSource={dataSource}
          resultsCount={resultsCount}
          onSelect={this.onSelect}
          onSearch={this.onSearchChange}
          onCancel={this.props.cancelFetchSearch}
          onSubmit={this.onSubmit}
          goToRoute={this.props.goToRoute}
        />
      </div>
    )
  }
}

const mapStateToProps = (state, props) => ({
  search: getSearch(state, props)
})
const mapDispatchToProps = (dispatch) => ({
  fetchSearch: (value) => dispatch(fetchSearch(value)),
  cancelFetchSearch: () => dispatch(cancelFetchSearch()),
  clearSearch: () => dispatch(clearSearch()),
  goToRoute: (route) => dispatch(pushRoute(route)),
  recordSearchResultClick: ({ term, kind, id, source }) =>
    dispatch(make(Name.SEARCH_RESULT_SELECT, { term, kind, id, source }))
})

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ConnectedSearchBar)
)
