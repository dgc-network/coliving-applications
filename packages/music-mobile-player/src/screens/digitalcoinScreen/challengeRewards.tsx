import { useEffect, useState } from 'react'

import type { ChallengeRewardID } from '@coliving/common'
import { removeNullable, StringKeys } from '@coliving/common'
import { getOptimisticUserChallenges } from '@coliving/web/src/common/store/challenges/selectors/optimistic-challenges'
import {
  getUserChallenges,
  getUserChallengesLoading
} from '@coliving/web/src/common/store/pages/digitalcoin-rewards/selectors'
import type { ChallengeRewardsModalType } from '@coliving/web/src/common/store/pages/digitalcoin-rewards/slice'
import {
  fetchUserChallenges,
  setChallengeRewardsModalType
} from '@coliving/web/src/common/store/pages/digitalcoin-rewards/slice'
import { setVisibility } from '@coliving/web/src/common/store/ui/modals/slice'
import { View } from 'react-native'

import LoadingSpinner from 'app/components/loadingSpinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { challengesConfig } from 'app/utils/challenges'

import { Panel } from './panel'

const validRewardIds: Set<ChallengeRewardID> = new Set([
  'digital-content-upload',
  'referrals',
  'ref-v',
  'mobile-install',
  'connect-verified',
  'listen-streak',
  'profile-completion',
  'referred',
  'send-first-tip',
  'first-content-list'
])

/** Pulls rewards from remoteconfig */
const useRewardIds = (
  hideConfig: Partial<Record<ChallengeRewardID, boolean>>
) => {
  const rewardsString = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  if (rewardsString === null) return []
  const rewards = rewardsString.split(',') as ChallengeRewardID[]
  const filteredRewards: ChallengeRewardID[] = rewards.filter(
    (reward) => validRewardIds.has(reward) && !hideConfig[reward]
  )
  return filteredRewards
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    width: '100%'
  }
}))

export const ChallengeRewards = () => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()

  const userChallengesLoading = useSelectorWeb(getUserChallengesLoading)
  const userChallenges = useSelectorWeb(getUserChallenges)
  const optimisticUserChallenges = useSelectorWeb(getOptimisticUserChallenges)
  const [haveChallengesLoaded, setHaveChallengesLoaded] = useState(false)

  // The referred challenge only needs a tile if the user was referred
  const hideReferredTile = !userChallenges.referred?.is_complete
  const rewardIds = useRewardIds({ referred: hideReferredTile })

  useEffect(() => {
    if (!userChallengesLoading && !haveChallengesLoaded) {
      setHaveChallengesLoaded(true)
    }
  }, [userChallengesLoading, haveChallengesLoaded])

  useEffect(() => {
    // Refresh user challenges on load
    dispatchWeb(fetchUserChallenges())
  }, [dispatchWeb])

  const openModal = (modalType: ChallengeRewardsModalType) => {
    dispatchWeb(setChallengeRewardsModalType({ modalType }))
    dispatchWeb(
      setVisibility({ modal: 'ChallengeRewardsExplainer', visible: true })
    )
  }

  const rewardsPanels = rewardIds
    // Filter out challenges that DN didn't return
    .map((id) => userChallenges[id]?.challenge_id)
    .filter(removeNullable)
    .map((id) => {
      const props = challengesConfig[id]
      return (
        <Panel
          {...props}
          challenge={optimisticUserChallenges[id]}
          onPress={() => openModal(id)}
          key={props.title}
        />
      )
    })

  return (
    <View style={styles.root}>
      {userChallengesLoading && !haveChallengesLoaded ? (
        <LoadingSpinner />
      ) : (
        rewardsPanels
      )}
    </View>
  )
}
