import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getIsOpen as getIsCreateContentListModalOpen } from 'common/store/ui/createContentListModal/selectors'
import { getModalVisibility } from 'common/store/ui/modals/slice'
import AddToContentListPage from 'components/add-to-content-list/mobile/AddToContentList'
import EditContentListPage from 'components/edit-content-list/mobile/EditContentListPage'
import useScrollLock from 'hooks/useScrollLock'
import { AppState } from 'store/types'

import styles from './TopLevelPage.module.css'

type TopLevelPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const rootElement = document.querySelector('#root')

const TopLevelPage = ({
  showCreateContentList,
  showAddToContentList
}: TopLevelPageProps) => {
  const showPage = showCreateContentList || showAddToContentList
  const isLocked = !!(showPage && rootElement)
  useScrollLock(isLocked)

  let page = null
  if (showCreateContentList) {
    page = <EditContentListPage />
  } else if (showAddToContentList) {
    page = <AddToContentListPage />
  }

  return (
    <div
      className={cn(styles.topLevelPage, {
        [styles.show]: showPage,
        [styles.darkerBackground]: showAddToContentList
      })}
    >
      {page}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    showCreateContentList: getIsCreateContentListModalOpen(state),
    showAddToContentList: getModalVisibility(state, 'AddToContentList')
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(TopLevelPage)
