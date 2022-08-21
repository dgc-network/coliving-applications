import { Playable, User } from '@coliving/common'

import { useIsMobile } from 'utils/clientUtil'

import DeletedPageProvider from './DeletedPageProvider'
import DeletedPageDesktopContent from './components/desktop/DeletedPage'
import DeletedPageMobileContent from './components/mobile/DeletedPage'

type DeletedPageContentProps = {
  title: string
  description: string
  canonicalUrl: string
  playable: Playable
  user: User
  deletedByLandlord?: boolean
}

const DeletedPage = ({
  title,
  description,
  canonicalUrl,
  playable,
  user,
  deletedByLandlord = true
}: DeletedPageContentProps) => {
  const isMobile = useIsMobile()

  const content = isMobile
    ? DeletedPageMobileContent
    : DeletedPageDesktopContent

  return (
    <DeletedPageProvider
      title={title}
      description={description}
      canonicalUrl={canonicalUrl}
      playable={playable}
      user={user}
      deletedByLandlord={deletedByLandlord}
    >
      {content}
    </DeletedPageProvider>
  )
}

export default DeletedPage
