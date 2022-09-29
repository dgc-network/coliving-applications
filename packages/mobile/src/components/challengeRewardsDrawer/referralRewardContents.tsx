//import React from 'react'
import * as React from 'react'

import { getUserHandle } from '@coliving/web/src/common/store/account/selectors'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { ReferralLinkCopyButton } from './referralLinkCopyButton'
import { TwitterShareButton } from './twitterShareButton'

export const ReferralRewardContents = ({
  isVerified
}: {
  isVerified: boolean
}) => {
  const handle = useSelectorWeb(getUserHandle)
  const inviteUrl = `.co/signup?ref=${handle}`

  return (
    <>
      <TwitterShareButton inviteUrl={inviteUrl} isVerified={isVerified} />
      <ReferralLinkCopyButton inviteUrl={inviteUrl} />
    </>
  )
}
