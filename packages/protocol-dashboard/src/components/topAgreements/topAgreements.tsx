import Error from 'components/error'
import Loading from 'components/loading'
import Paper from 'components/paper'
import React, { useCallback } from 'react'
import { useTopAgreements } from 'store/cache/music/hooks'
import { MusicError } from 'store/cache/music/slice'
import { createStyles } from 'utils/mobile'

import desktopStyles from './TopAgreements.module.css'
import mobileStyles from './TopAgreementsMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'Top Agreements This Week'
}

type TopAgreementsProps = {}

const TopAgreements: React.FC<TopAgreementsProps> = () => {
  const { topAgreements } = useTopAgreements()
  const goToUrl = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  const renderTopAgreements = () => {
    if (topAgreements === MusicError.ERROR) return <Error />
    return !!topAgreements ? (
      topAgreements.map((t, i) => (
        <div key={i} className={styles.digital_content}>
          <div
            className={styles.artwork}
            onClick={() => goToUrl(t.url)}
            style={{
              backgroundImage: `url(${t.artwork})`
            }}
          />
          <div className={styles.agreementTitle} onClick={() => goToUrl(t.url)}>
            {t.title}
          </div>
          <div className={styles.handle} onClick={() => goToUrl(t.userUrl)}>
            {t.handle}
          </div>
        </div>
      ))
    ) : (
      <Loading className={styles.loading} />
    )
  }
  return (
    <Paper className={styles.container}>
      <div className={styles.title}>{messages.title}</div>
      <div className={styles.agreements}>{renderTopAgreements()}</div>
    </Paper>
  )
}

export default TopAgreements
