import { ID } from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconRemix } from 'assets/img/iconRemix.svg'
import ConnectedRemixCard from 'components/remixCard/connectedRemixCard'
import SectionButton from 'components/sectionButton/sectionButton'
import { isMatrix } from 'utils/theme/theme'

import styles from './remixes.module.css'

const messages = {
  title: 'Remixes',
  viewAll: (count: number | null) =>
    `View All ${count && count > 6 ? count : ''} Remixes`
}

type RemixesProps = {
  digitalContentIds: ID[]
  goToAllRemixes: () => void
  count: number | null
}

const Remixes = ({ digitalContentIds, goToAllRemixes, count }: RemixesProps) => {
  return (
    <div className={styles.remixes}>
      <div className={styles.header}>
        <IconRemix
          className={cn(styles.iconRemix, { [styles.matrix]: isMatrix() })}
        />
        <span>{messages.title}</span>
      </div>
      <div className={styles.digitalContents}>
        {digitalContentIds.map((id) => {
          return <ConnectedRemixCard key={id} digitalContentId={id} />
        })}
      </div>
      <div className={styles.button}>
        <SectionButton
          isMobile
          text={messages.viewAll(count)}
          onClick={goToAllRemixes}
        />
      </div>
    </div>
  )
}

export default Remixes
