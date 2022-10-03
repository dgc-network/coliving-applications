import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as SortIcon } from 'assets/img/iconSort.svg'
import { PopupMenuIconButton } from 'components/popupMenuIconButton/popupMenuIconButton'

import styles from './NavBanner.module.css'

const NavBanner = (props) => {
  const menuItems = [
    {
      text: 'Sort by Recent',
      onClick: props.onSortByRecent
    },
    {
      text: 'Sort by Popular',
      onClick: props.onSortByPopular
    }
  ]
  return (
    <div className={styles.wrapper}>
      <div className={styles.background} />
      {!props.empty ? (
        <div
          className={cn(styles.navBanner, {
            overflowVisible: !props.shouldMaskContent
          })}
        >
          <div className={styles.tabs}>{props.tabs}</div>

          {props.isLandlord && (
            <div className={styles.dropdown}>
              {!props.dropdownDisabled && (
                <PopupMenuIconButton
                  icon={<SortIcon />}
                  items={menuItems}
                  position='bottomLeft'
                />
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

NavBanner.propTypes = {
  tabs: PropTypes.element,
  dropdownDisabled: PropTypes.bool,
  empty: PropTypes.bool,
  onChange: PropTypes.func,
  onSortByRecent: PropTypes.func,
  onSortByPopular: PropTypes.func,
  shouldMaskContent: PropTypes.bool,
  activeTab: PropTypes.string,
  isLandlord: PropTypes.bool
}

NavBanner.defaultProps = {
  dropdownDisabled: false,
  empty: false,
  onSortByRecent: () => {},
  onSortByPopular: () => {}
}

export default NavBanner
