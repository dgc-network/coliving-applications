import { useCallback } from 'react'

import type { ID } from '@coliving/common'
import { getUsers } from '@coliving/web/src/common/store/cache/users/selectors'
import { getOptimisticSupportingForUser } from '@coliving/web/src/common/store/tipping/selectors'
import type { SupportingMapForUser } from '@coliving/web/src/common/store/tipping/types'
import { stringWeiToBN } from '@coliving/web/src/common/utils/wallet'
import { MAX_PROFILE_SUPPORTING_TILES } from '@coliving/web/src/utils/constants'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Tile, TextButton } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { ProfilePictureList } from 'app/screens/notificationsScreen/notification'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'

const MAX_PROFILE_SUPPORTING_VIEW_ALL_USERS = 5

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(2),
    marginHorizontal: spacing(1)
  },
  content: {
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
    height: 88
  },
  profilePictureList: {
    marginBottom: spacing(3),
    marginRight: spacing(2)
  }
}))

const messages = {
  viewAll: 'View All'
}

export const ViewAllSupportingTile = () => {
  const styles = useStyles()
  const navigation = useNavigation()

  const { user_id, supporting_count } = useSelectProfile([
    'user_id',
    'supporting_count'
  ])
  const supportingForProfile: SupportingMapForUser =
    useSelectorWeb((state) => getOptimisticSupportingForUser(state, user_id)) ||
    {}
  const rankedSupportingIds = Object.keys(supportingForProfile)
    .sort((k1, k2) => {
      const amount1BN = stringWeiToBN(
        supportingForProfile[k1 as unknown as ID].amount
      )
      const amount2BN = stringWeiToBN(
        supportingForProfile[k2 as unknown as ID].amount
      )
      return amount1BN.gte(amount2BN) ? -1 : 1
    })
    .map((k) => supportingForProfile[k as unknown as ID])
    .map((s) => s.receiver_id)
  const rankedSupporting = useSelectorWeb((state) => {
    const usersMap = getUsers(state, { ids: rankedSupportingIds })
    return rankedSupportingIds.map((id) => usersMap[id]).filter(Boolean)
  })

  const handlePress = useCallback(() => {
    navigation.push({
      native: { screen: 'SupportingUsers', params: { userId: user_id } }
    })
  }, [navigation, user_id])

  return (
    <Tile
      styles={{
        root: styles.root,
        content: styles.content
      }}
      onPress={handlePress}
    >
      <ProfilePictureList
        users={rankedSupporting.slice(MAX_PROFILE_SUPPORTING_TILES)}
        totalUserCount={supporting_count - MAX_PROFILE_SUPPORTING_TILES}
        limit={MAX_PROFILE_SUPPORTING_VIEW_ALL_USERS}
        style={styles.profilePictureList}
        navigationType='push'
        interactive={false}
      />
      <TextButton
        disabled
        showDisabled={false}
        variant='neutralLight4'
        icon={IconArrow}
        iconPosition='right'
        title={messages.viewAll}
        TextProps={{ fontSize: 'small', weight: 'bold' }}
      />
    </Tile>
  )
}
