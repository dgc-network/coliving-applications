import React from 'react'
import Page from 'components/page'
import Proposals from 'components/proposals'

const messages = {
  title: 'All Governance Proposals'
}

type GovernanceProps = {}
const Governance: React.FC<GovernanceProps> = (props: GovernanceProps) => {
  return (
    <Page title={messages.title} hidePreviousPage>
      <Proposals />
    </Page>
  )
}

export default Governance
