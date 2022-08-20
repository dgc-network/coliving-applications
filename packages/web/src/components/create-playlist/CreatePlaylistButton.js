import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconCreateContentList } from 'assets/img/iconCreateContentList.svg'

import styles from './CreateContentListButton.module.css'

const CreateContentListButton = (props) => {
  return (
    <button
      className={cn(props.className, styles.createContentListButton)}
      onClick={props.onClick}
    >
      <IconCreateContentList />
      <div>Create ContentList</div>
    </button>
  )
}

CreateContentListButton.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func
}

export default CreateContentListButton
