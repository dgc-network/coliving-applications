import { useCallback } from 'react'

import { Name, CreateContentListSource } from '@coliving/common'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import * as createContentListActions from 'common/store/ui/createContentListModal/actions'
import { useRecord, make } from 'store/analytics/actions'
import { AppState } from 'store/types'

import styles from './NewContentListButton.module.css'

const messages = {
  createContentList: 'Create a New ContentList'
}

type OwnProps = {
  onClick?: () => void
}

type NewContentListButtonProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const NewContentListButton = ({ open, onClick }: NewContentListButtonProps) => {
  const record = useRecord()

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    } else {
      open()
    }
    record(
      make(Name.CONTENT_LIST_OPEN_CREATE, {
        source: CreateContentListSource.FAVORITES_PAGE
      })
    )
  }, [open, onClick, record])

  return (
    <button className={styles.button} onClick={handleClick}>
      {messages.createContentList}
    </button>
  )
}

function mapStateToProps(state: AppState) {
  return {}
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    open: () => dispatch(createContentListActions.open(undefined, true))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NewContentListButton)
