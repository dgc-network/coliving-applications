import { useContext, useEffect } from 'react'

import { getUserList } from 'common/store/userList/reposts/selectors'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/store/context'
import UserList from 'components/userList/userList'
import { USER_LIST_TAG } from 'pages/repostsPage/sagas'

const messages = {
  title: 'Reposts'
}

const RepostsPage = () => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!

  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.title)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer fullHeight>
      <UserList stateSelector={getUserList} tag={USER_LIST_TAG} />
    </MobilePageContainer>
  )
}

export default RepostsPage
