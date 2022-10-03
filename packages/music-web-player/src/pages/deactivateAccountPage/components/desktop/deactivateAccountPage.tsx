import Header from 'components/header/desktop/header'
import Page from 'components/page/page'

import {
  messages,
  DeactivateAccountPageProps
} from '../../deactivateAccountPage'

import { DeactivateAccountConfirmationModal } from './deactivateAccountConfirmationModal'

export const DeactivateAccountPageDesktop = ({
  children,
  isConfirmationVisible,
  isLoading,
  onConfirm,
  closeConfirmation
}: DeactivateAccountPageProps) => {
  return (
    <Page
      title={messages.title}
      description={messages.description}
      header={<Header primary={messages.title} />}
    >
      {children}
      <DeactivateAccountConfirmationModal
        isVisible={isConfirmationVisible}
        onClose={closeConfirmation}
        onConfirm={onConfirm}
        isLoading={isLoading}
      />
    </Page>
  )
}
