import { Fragment, useCallback } from 'react'

import { FollowSource } from '@coliving/common'
import {
  followUser,
  unfollowUser
} from '@coliving/web/src/common/store/social/users/actions'
import { makeGetRelatedLandlords } from '@coliving/web/src/common/store/ui/author-recommendations/selectors'
import { fetchRelatedLandlords } from '@coliving/web/src/common/store/ui/author-recommendations/slice'
import { TouchableOpacity, View } from 'react-native'
import { useEffectOnce } from 'react-use'

import IconFollow from 'app/assets/images/iconFollow.svg'
import IconFollowing from 'app/assets/images/iconFollowing.svg'
import IconClose from 'app/assets/images/iconRemove.svg'
import { Button, IconButton, Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { digital_content, make } from 'app/utils/analytics'

import { useSelectProfile } from '../selectors'

import { LandlordLink } from './authorLink'

const messages = {
  description: 'Here are some accounts that vibe well with',
  followAll: 'Follow All',
  followingAll: 'Following All'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    paddingTop: spacing(2),
    paddingBottom: spacing(4),
    paddingHorizontal: spacing(3),
    marginHorizontal: spacing(-3),
    marginBottom: spacing(2),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  header: {
    flexDirection: 'row'
  },
  dismissButton: {
    marginRight: spacing(2)
  },
  dismissIcon: {
    height: 24,
    width: 24,
    fill: palette.neutralLight4
  },
  suggestedLandlordsPhotos: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing(2)
  },
  suggestedLandlordPhoto: {
    height: 52,
    width: 52,
    marginRight: -7,
    borderWidth: 1
  },
  suggestedLandlordsText: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing(2)
  },
  followButtonText: {
    fontSize: typography.fontSize.medium
  }
}))

type LandlordRecommendationsProps = {
  onClose: () => void
}

const getRelatedLandlordIds = makeGetRelatedLandlords()

export const LandlordRecommendations = (props: LandlordRecommendationsProps) => {
  const { onClose } = props
  const styles = useStyles()
  const navigation = useNavigation()
  const { user_id, name } = useSelectProfile(['user_id', 'name'])

  const dispatchWeb = useDispatchWeb()

  useEffectOnce(() => {
    dispatchWeb(fetchRelatedLandlords({ userId: user_id }))

    digital_content(
      make({
        eventName: EventNames.PROFILE_PAGE_SHOWN_LANDLORD_RECOMMENDATIONS,
        userId: user_id
      })
    )
  })

  const suggestedLandlords = useSelectorWeb(
    (state) => getRelatedLandlordIds(state, { id: user_id }),
    (a, b) => a.length === b.length
  )

  const isFollowingAllLandlords = suggestedLandlords.every(
    (author) => author.does_current_user_follow
  )

  const handlePressFollow = useCallback(() => {
    suggestedLandlords.forEach((author) => {
      if (isFollowingAllLandlords) {
        dispatchWeb(
          unfollowUser(
            author.user_id,
            FollowSource.LANDLORD_RECOMMENDATIONS_POPUP
          )
        )
      } else {
        dispatchWeb(
          followUser(author.user_id, FollowSource.LANDLORD_RECOMMENDATIONS_POPUP)
        )
      }
    })
  }, [suggestedLandlords, isFollowingAllLandlords, dispatchWeb])

  const handlePressLandlord = useCallback(
    (author) => () => {
      navigation.push({
        native: { screen: 'Profile', params: { handle: author.handle } },
        web: { route: `/${author.handle}` }
      })
    },
    [navigation]
  )

  const suggestedLandlordNames = suggestedLandlords.slice(0, 3)

  if (suggestedLandlords.length === 0) {
    return null
  }

  return (
    <View pointerEvents='box-none' style={styles.root}>
      <View style={styles.header} pointerEvents='box-none'>
        <IconButton
          icon={IconClose}
          styles={{ root: styles.dismissButton, icon: styles.dismissIcon }}
          fill={styles.dismissIcon.fill}
          onPress={onClose}
        />
        <View pointerEvents='none'>
          <Text variant='body1'>
            {messages.description} {name}
          </Text>
        </View>
      </View>
      <View style={styles.suggestedLandlordsPhotos} pointerEvents='box-none'>
        {suggestedLandlords.map((author) => (
          <TouchableOpacity
            onPress={handlePressLandlord(author)}
            key={author.user_id}
          >
            <ProfilePicture
              profile={author}
              style={styles.suggestedLandlordPhoto}
            />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.suggestedLandlordsText} pointerEvents='box-none'>
        <View pointerEvents='none'>
          <Text variant='body1'>Featuring </Text>
        </View>
        {suggestedLandlordNames.map((author) => (
          <Fragment key={author.user_id}>
            <LandlordLink author={author} onPress={handlePressLandlord(author)} />
            <Text variant='body1'>, </Text>
          </Fragment>
        ))}
        <View pointerEvents='none'>
          <Text variant='body1'>{`and ${
            suggestedLandlords.length - suggestedLandlordNames.length
          } others`}</Text>
        </View>
      </View>
      <Button
        variant='primary'
        title={
          isFollowingAllLandlords ? messages.followingAll : messages.followAll
        }
        icon={isFollowingAllLandlords ? IconFollowing : IconFollow}
        iconPosition='left'
        fullWidth
        onPress={handlePressFollow}
        styles={{
          text: styles.followButtonText
        }}
      />
    </View>
  )
}
