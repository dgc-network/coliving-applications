import { StyleSheet, View, Keyboard } from 'react-native'
import { useSelector } from 'react-redux'

import { SectionList } from 'app/components/core'
import { getSearchResults } from 'app/store/search/selectors'
import type {
  SearchUser,
  SearchAgreement,
  SearchContentList,
  SectionHeader
} from 'app/store/search/types'

import SearchItem from './content/searchItem'
import SearchSectionHeader from './content/searchSectionHeader'
import { SeeMoreResultsButton } from './content/seeMoreResultsButton'

const messages = {
  profile: 'PROFILES',
  agreements: 'AGREEMENTS',
  contentLists: 'CONTENT_LISTS',
  albums: 'ALBUMS'
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

const sectionHeaders: SectionHeader[] = [
  'users',
  'agreements',
  'contentLists',
  'albums'
]
const headerMapping: { [key in SectionHeader]: string } = {
  users: messages.profile,
  agreements: messages.agreements,
  contentLists: messages.contentLists,
  albums: messages.albums
}

const SearchResults = () => {
  const searchResults = useSelector(getSearchResults)
  const sections = sectionHeaders
    .map((header) => {
      return {
        title: header,
        data: searchResults[header]
      }
    })
    .filter((result) => result.data.length > 0)

  const sectionWithMore: {
    title: SectionHeader | 'more'
    data: (SearchUser | SearchAgreement | SearchContentList)[]
  }[] = [...sections, { title: 'more', data: [] }]

  return (
    <View style={styles.container} onTouchStart={Keyboard.dismiss}>
      <SectionList
        keyboardShouldPersistTaps={'always'}
        stickySectionHeadersEnabled={false}
        sections={sectionWithMore}
        keyExtractor={(item) => {
          if ('digital_content_id' in item) return `digital-content-${item.digital_content_id}`
          else if ('user_id' in item) return `user-${item.user_id}`
          return `content-list-${item.content_list_id}`
        }}
        renderItem={({ section: { title, data }, item, index }) => (
          <SearchItem
            isLast={index === data.length - 1}
            type={title as SectionHeader}
            item={item}
          />
        )}
        renderSectionHeader={({ section: { title } }) =>
          title === 'more' ? (
            <SeeMoreResultsButton />
          ) : (
            <SearchSectionHeader
              title={headerMapping[title as SectionHeader]}
            />
          )
        }
      />
    </View>
  )
}

export default SearchResults
