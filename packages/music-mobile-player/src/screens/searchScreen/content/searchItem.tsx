import { useCallback } from 'react'

import { StyleSheet, View, Text, TouchableHighlight } from 'react-native'
import { useDispatch } from 'react-redux'

import IconArrow from 'app/assets/images/iconArrow.svg'
import ContentListImage from 'app/components/image/contentListImage'
import DigitalContentImage from 'app/components/image/DigitalContentImage'
import UserImage from 'app/components/image/userImage'
import UserBadges from 'app/components/userBadges/userBadges'
import { useNavigation } from 'app/hooks/useNavigation'
import { close as closeSearch } from 'app/store/search/actions'
import useSearchHistory from 'app/store/search/hooks'
import type {
  SearchContentList,
  SearchDigitalContent,
  SearchUser,
  SectionHeader
} from 'app/store/search/types'
import {
  getDigitalContentRoute,
  getUserRoute,
  getCollectionRoute
} from 'app/utils/routes'
import { useColor, useTheme } from 'app/utils/theme'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    height: 58
  },
  name: {
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Medium'
  },
  badgeContainer: {
    flex: 1
  },
  nameContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  userImage: {
    borderRadius: 20,
    height: 40,
    width: 40,
    marginRight: 12
  },
  squareImage: {
    borderRadius: 4,
    height: 40,
    width: 40,
    marginRight: 12
  }
})

type ItemContainerProps = { isLast: boolean; onPress: () => void }
const ItemContainer: React.FunctionComponent<ItemContainerProps> = ({
  isLast,
  onPress,
  children
}) => {
  const color = useColor('neutralLight4')
  const backgroundColor = useColor('neutralLight8')
  const containerStyle = useTheme(styles.container, {
    borderBottomColor: 'neutralLight8'
  })
  const viewStyle = isLast ? styles.container : containerStyle
  return (
    <TouchableHighlight underlayColor={backgroundColor} onPress={onPress}>
      <View style={viewStyle}>
        {children}
        <IconArrow fill={color} height={18} width={18} />
      </View>
    </TouchableHighlight>
  )
}

type UserSearchResultProps = { isLast: boolean; item: SearchUser }

const UserSearchResult = ({ isLast, item: user }: UserSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const imageStyle = useTheme(styles.userImage, {
    backgroundColor: 'neutralLight4'
  })
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { appendSearchItem } = useSearchHistory()

  const handlePress = useCallback(() => {
    appendSearchItem(user.name)
    const userRoute = getUserRoute(user)
    dispatch(closeSearch())
    navigation.push({
      native: {
        screen: 'Profile',
        params: { handle: user.handle }
      },
      web: { route: userRoute, fromPage: 'search' }
    })
  }, [user, dispatch, navigation, appendSearchItem])

  return (
    <ItemContainer isLast={isLast} onPress={handlePress}>
      <UserImage user={user} imageStyle={imageStyle} />
      <UserBadges
        style={styles.badgeContainer}
        nameStyle={nameStyle}
        user={user}
      />
    </ItemContainer>
  )
}

type DigitalContentSearchResultProps = { isLast: boolean; item: SearchDigitalContent }
const DigitalContentSearchResult = ({ isLast, item: digital_content }: DigitalContentSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const userNameStyle = useTheme(styles.name, { color: 'neutralLight4' })
  const squareImageStyles = useTheme(styles.squareImage, {
    backgroundColor: 'neutralLight4'
  })

  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { appendSearchItem } = useSearchHistory()

  const handlePress = useCallback(() => {
    appendSearchItem(digital_content.title)
    const digitalContentRoute = getDigitalContentRoute(digital_content)
    dispatch(closeSearch())
    navigation.push({
      native: {
        screen: 'DigitalContent',
        params: { id: digital_content.digital_content_id, searchDigitalContent: digital_content }
      },
      web: { route: digitalContentRoute, fromPage: 'search' }
    })
  }, [digital_content, dispatch, navigation, appendSearchItem])

  return (
    <ItemContainer isLast={isLast} onPress={handlePress}>
      <DigitalContentImage
        digital_content={digital_content}
        user={digital_content.user}
        imageStyle={squareImageStyles}
      />
      <View style={styles.nameContainer}>
        <Text numberOfLines={1} style={nameStyle}>
          {digital_content.title}
        </Text>
        <UserBadges
          style={styles.badgeContainer}
          nameStyle={userNameStyle}
          user={digital_content.user}
        />
      </View>
    </ItemContainer>
  )
}

type ContentListSearchResultProps = { isLast: boolean; item: SearchContentList }
const ContentListSearchResult = ({
  isLast,
  item: contentList
}: ContentListSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const userNameStyle = useTheme(styles.name, { color: 'neutralLight4' })
  const squareImageStyles = useTheme(styles.squareImage, {
    backgroundColor: 'neutralLight4'
  })

  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { appendSearchItem } = useSearchHistory()

  const handlePress = useCallback(() => {
    appendSearchItem(contentList.content_list_name)
    const collectionRoute = getCollectionRoute(contentList as any)
    dispatch(closeSearch())
    navigation.push({
      native: {
        screen: 'Collection',
        params: { id: contentList.content_list_id, searchCollection: contentList }
      },
      web: { route: collectionRoute, fromPage: 'search' }
    })
  }, [contentList, dispatch, navigation, appendSearchItem])

  return (
    <ItemContainer isLast={isLast} onPress={handlePress}>
      <ContentListImage
        contentList={contentList}
        user={contentList.user}
        imageStyle={squareImageStyles}
      />
      <View style={styles.nameContainer}>
        <Text numberOfLines={1} style={nameStyle}>
          {contentList.content_list_name}
        </Text>
        <UserBadges
          style={styles.badgeContainer}
          nameStyle={userNameStyle}
          user={contentList.user}
        />
      </View>
    </ItemContainer>
  )
}

type AlbumSearchResultProps = { isLast: boolean; item: SearchContentList }
const AlbumSearchResult = ({ isLast, item: album }: AlbumSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const userNameStyle = useTheme(styles.name, { color: 'neutralLight4' })
  const squareImageStyles = useTheme(styles.squareImage, {
    backgroundColor: 'neutralLight4'
  })

  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { appendSearchItem } = useSearchHistory()

  const handlePress = useCallback(() => {
    appendSearchItem(album.content_list_name)
    const collectionRoute = getCollectionRoute(album as any)
    dispatch(closeSearch())
    navigation.push({
      native: {
        screen: 'Collection',
        params: { id: album.content_list_id, searchCollection: album }
      },
      web: { route: collectionRoute, fromPage: 'search' }
    })
  }, [album, dispatch, navigation, appendSearchItem])

  return (
    <ItemContainer isLast={isLast} onPress={handlePress}>
      <ContentListImage
        contentList={album}
        user={album.user}
        imageStyle={squareImageStyles}
      />
      <View style={styles.nameContainer}>
        <Text numberOfLines={1} style={nameStyle}>
          {album.content_list_name}
        </Text>
        <UserBadges
          style={styles.badgeContainer}
          nameStyle={userNameStyle}
          user={album.user}
        />
      </View>
    </ItemContainer>
  )
}

type SearchItemProps = {
  isLast: boolean
  type: SectionHeader
  item: SearchUser | SearchDigitalContent | SearchContentList
}
const SearchItem = ({ isLast, type, item }: SearchItemProps) => {
  switch (type) {
    case 'users':
      return <UserSearchResult isLast={isLast} item={item as SearchUser} />
    case 'digitalContents':
      return <DigitalContentSearchResult isLast={isLast} item={item as SearchDigitalContent} />
    case 'contentLists':
      return (
        <ContentListSearchResult isLast={isLast} item={item as SearchContentList} />
      )
    case 'albums':
      return <AlbumSearchResult isLast={isLast} item={item as SearchContentList} />
    default:
      return null
  }
}

export default SearchItem
