import { removeNullable } from '@coliving/common'
import {
  IconCrown,
  IconDashboard,
  IconSettings,
  PopupMenu,
  PopupMenuItem,
  PopupPosition
} from '@coliving/stems'
import cn from 'classnames'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontalAlt.svg'
import { getAccountHasAgreements } from 'common/store/account/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useSelector } from 'utils/reducer'
import { LIVE_PAGE, DASHBOARD_PAGE, SETTINGS_PAGE } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './NavPopupMenu.module.css'

const messages = {
  settings: 'Settings',
  dashboard: 'Landlord Dashboard',
  live: '$LIVE & Rewards'
}

const useAccountHasAgreements = () => {
  return useSelector(getAccountHasAgreements)
}

const NavPopupMenu = () => {
  const navigate = useNavigateToPage()
  const hasAgreements = useAccountHasAgreements()

  const menuItems: PopupMenuItem[] = [
    {
      text: messages.settings,
      onClick: () => navigate(SETTINGS_PAGE),
      icon: <IconSettings />,
      iconClassName: styles.menuItemIcon
    },
    hasAgreements
      ? {
          text: messages.dashboard,
          onClick: () => navigate(DASHBOARD_PAGE),
          icon: <IconDashboard />,
          iconClassName: styles.menuItemIcon
        }
      : null,
    {
      text: messages.live,
      className: styles.rewardsMenuItem,
      onClick: () => navigate(LIVE_PAGE),
      icon: <IconCrown />,
      iconClassName: cn(styles.menuItemIcon, styles.crownIcon)
    }
  ].filter(removeNullable)

  return (
    <div className={styles.headerIconWrapper}>
      <PopupMenu
        items={menuItems}
        position={PopupPosition.BOTTOM_RIGHT}
        renderTrigger={(anchorRef, triggerPopup) => {
          return (
            <div className={styles.icon} ref={anchorRef} onClick={triggerPopup}>
              <IconKebabHorizontal />
            </div>
          )
        }}
        zIndex={zIndex.NAVIGATOR_POPUP}
      />
    </div>
  )
}

export default NavPopupMenu
