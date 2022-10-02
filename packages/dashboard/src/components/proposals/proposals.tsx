import React, { useState, useCallback } from 'react'
import clsx from 'clsx'
import { Utils } from '@coliving/sdk'

import { useProposals } from 'store/cache/proposals/hooks'
import Paper from 'components/paper'
import Button, { ButtonType } from 'components/button'
import { IconSave } from '@coliving/stems'
import styles from './Proposals.module.css'
import NewProposalModal from 'components/newProposalModal'
import Proposal from 'components/proposal/proposal'
import Loading from 'components/loading'
import { useAccountUser } from 'store/account/hooks'
import { Status } from 'types'
import getActiveStake from 'utils/activeStake'

const messages = {
  newProposal: 'New Proposal',
  activeProposals: 'Active Proposals',
  allProposals: 'Resolved Proposals',
  noActiveProposals: 'No active proposals',
  noProposals: 'No resolved proposals'
}

type OwnProps = {}

type ProposalsProps = OwnProps

const NewProposalBtn = () => {
  const [isOpen, setIsOpen] = useState(false)
  const onClick = useCallback(() => setIsOpen(true), [setIsOpen])
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen])
  return (
    <>
      <Button
        onClick={onClick}
        leftIcon={<IconSave />}
        type={ButtonType.PRIMARY}
        text={messages.newProposal}
        className={clsx(styles.registerBtn)}
        textClassName={styles.registerBtnText}
      />
      <NewProposalModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

export const NoProposals = ({ text }: { text: string }) => {
  return <div className={styles.noProposals}>{text}</div>
}

const Proposals: React.FC<ProposalsProps> = () => {
  const { activeProposals, resolvedProposals } = useProposals()
  const { status: userStatus, user: accountUser } = useAccountUser()
  const activeStake = accountUser
    ? getActiveStake(accountUser)
    : Utils.toBN('0')
  const isUserStaker = userStatus === Status.Success && !activeStake.isZero()

  return (
    <>
      <Paper className={clsx(styles.container, styles.active)}>
        <div className={styles.title}>
          <span>{messages.activeProposals}</span>
          {isUserStaker && <NewProposalBtn />}
        </div>
        <div className={styles.list}>
          {!!activeProposals ? (
            activeProposals.length > 0 ? (
              activeProposals.map((proposal, i) => (
                <Proposal key={i} proposal={proposal} />
              ))
            ) : (
              <NoProposals text={messages.noActiveProposals} />
            )
          ) : (
            <Loading className={styles.loading} />
          )}
        </div>
      </Paper>
      <Paper className={clsx(styles.container, styles.all)}>
        <div className={styles.title}>{messages.allProposals}</div>
        <div className={styles.list}>
          {!!resolvedProposals ? (
            resolvedProposals.length > 0 ? (
              resolvedProposals.map((proposal, i) => (
                <Proposal key={i} proposal={proposal} />
              ))
            ) : (
              <NoProposals text={messages.noProposals} />
            )
          ) : (
            <Loading className={styles.loading} />
          )}
        </div>
      </Paper>
    </>
  )
}

export default Proposals
