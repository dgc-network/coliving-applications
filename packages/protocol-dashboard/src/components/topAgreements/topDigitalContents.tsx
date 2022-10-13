import Error from 'components/error'
import Loading from 'components/loading'
import Paper from 'components/paper'
import React, { useCallback } from 'react'
import { useTopDigitalContents } from 'store/cache/music/hooks'
import { MusicError } from 'store/cache/music/slice'
import { createStyles } from 'utils/mobile'

import desktopStyles from './TopDigitalContents.module.css'
import mobileStyles from './TopDigitalContentsMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'Top DigitalContents This Week'
}

type TopDigitalContentsProps = {}

const TopDigitalContents: React.FC<TopDigitalContentsProps> = () => {
  const { topDigitalContents } = useTopDigitalContents()
  const goToUrl = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  const renderTopDigitalContents = () => {
    if (topDigitalContents === MusicError.ERROR) return <Error />
    return !!topDigitalContents ? (
      topDigitalContents.map((t, i) => (
        <div key={i} className={styles.digital_content}>
          <div
            className={styles.artwork}
            onClick={() => goToUrl(t.url)}
            style={{
              backgroundImage: `url(${t.artwork})`
            }}
          />
          <div className={styles.digitalContentTitle} onClick={() => goToUrl(t.url)}>
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
      <div className={styles.digitalContents}>{renderTopDigitalContents()}</div>
    </Paper>
  )
}

export default TopDigitalContents
