import { Fragment, useCallback } from 'react'

import { FollowSource } from '@/common'
import {
  followUser,
  unfollowUser
} from '-client/src/common/store/social/users/actions'
import { makeGetRelatedLandlords } from '-client/src/common/store/ui/landlord-recommendations/selectors'
import { fetchRelatedLandlords } from '-client/src/common/store/ui/landlord-recommendations/slice'
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
import { agreement, make } from 'app/utils/analytics'

import { useSelectProfile } from '../selectors'

import { LandlordLink } from './LandlordLink'

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

    agreement(
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
    (landlord) => landlord.does_current_user_follow
  )

  const handlePressFollow = useCallback(() => {
    suggestedLandlords.forEach((landlord) => {
      if (isFollowingAllLandlords) {
        dispatchWeb(
          unfollowUser(
            landlord.user_id,
            FollowSource.LANDLORD_RECOMMENDATIONS_POPUP
          )
        )
      } else {
        dispatchWeb(
          followUser(landlord.user_id, FollowSource.LANDLORD_RECOMMENDATIONS_POPUP)
        )
      }
    })
  }, [suggestedLandlords, isFollowingAllLandlords, dispatchWeb])

  const handlePressLandlord = useCallback(
    (landlord) => () => {
      navigation.push({
        native: { screen: 'Profile', params: { handle: landlord.handle } },
        web: { route: `/${landlord.handle}` }
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
        {suggestedLandlords.map((landlord) => (
          <TouchableOpacity
            onPress={handlePressLandlord(landlord)}
            key={landlord.user_id}
          >
            <ProfilePicture
              profile={landlord}
              style={styles.suggestedLandlordPhoto}
            />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.suggestedLandlordsText} pointerEvents='box-none'>
        <View pointerEvents='none'>
          <Text variant='body1'>Featuring </Text>
        </View>
        {suggestedLandlordNames.map((landlord) => (
          <Fragment key={landlord.user_id}>
            <LandlordLink landlord={landlord} onPress={handlePressLandlord(landlord)} />
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
