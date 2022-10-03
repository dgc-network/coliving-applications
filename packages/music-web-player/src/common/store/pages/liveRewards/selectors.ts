import { ChallengeRewardID } from '@coliving/common'
import { createSelector } from 'reselect'

import { CommonState } from 'common/store'

export const getTrendingRewardsModalType = (state: CommonState) =>
  state.pages.liveRewards.trendingRewardsModalType

export const getChallengeRewardsModalType = (state: CommonState) =>
  state.pages.liveRewards.challengeRewardsModalType

export const getUserChallengeSpecifierMap = (state: CommonState) =>
  state.pages.liveRewards.userChallenges

// Returns just a single challenge per challengeId
export const getUserChallenges = createSelector(
  [getUserChallengeSpecifierMap],
  (challenges) => {
    return Object.values(challenges).reduce((acc, cur) => {
      const challenge = Object.values(cur)[0]
      if (!challenge) return acc // Shouldn't happen
      return {
        ...acc,
        [challenge.challenge_id]: challenge
      }
    }, {})
  }
)

export const getUndisbursedUserChallenges = (state: CommonState) =>
  state.pages.liveRewards.undisbursedChallenges.filter((challenge: { challenge_id: string | number; specifier: any }) => {
    return !(
      state.pages.liveRewards.disbursedChallenges[challenge.challenge_id] ?? []
    ).includes(challenge.specifier)
  })

export const getUserChallenge = (
  state: CommonState,
  props: { challengeId: ChallengeRewardID }
) =>
  Object.values(
    state.pages.liveRewards.userChallenges[props.challengeId] || {}
  )[0]

export const getUserChallengesOverrides = (state: CommonState) =>
  state.pages.liveRewards.userChallengesOverrides

export const getUserChallengesLoading = (state: CommonState) =>
  state.pages.liveRewards.loading

export const getClaimStatus = (state: CommonState) =>
  state.pages.liveRewards.claimStatus

export const getClaimToRetry = (state: CommonState) =>
  state.pages.liveRewards.claimToRetry

export const getHCaptchaStatus = (state: CommonState) =>
  state.pages.liveRewards.hCaptchaStatus

export const getCognitoFlowStatus = (state: CommonState) =>
  state.pages.liveRewards.cognitoFlowStatus

export const getCognitoFlowUrl = (state: CommonState) =>
  state.pages.liveRewards.cognitoFlowUrl

export const getCognitoFlowUrlStatus = (state: CommonState) =>
  state.pages.liveRewards.cognitoFlowUrlStatus

export const getShowRewardClaimedToast = (state: CommonState) =>
  state.pages.liveRewards.showRewardClaimedToast
