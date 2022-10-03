import Error from 'components/error'
import Loading from 'components/loading'
import Paper from 'components/paper'
import React, { useCallback } from 'react'
import { useTopContentLists } from 'store/cache/music/hooks'
import { MusicError } from 'store/cache/music/slice'

import styles from './TopContentLists.module.css'

const messages = {
  title: 'Top Content Lists This Week'
}

type TopContentListsProps = {}

const TopContentLists: React.FC<TopContentListsProps> = () => {
  const { topContentLists } = useTopContentLists()
  const goToUrl = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  const renderTopContentLists = () => {
    if (topContentLists === MusicError.ERROR) return <Error />
    return !!topContentLists ? (
      topContentLists!.map((p, i) => (
        <div key={i} className={styles.contentList} onClick={() => goToUrl(p.url)}>
          <div
            className={styles.artwork}
            style={{
              backgroundImage: `url(${p.artwork})`
            }}
          />
          <div className={styles.text}>
            <div className={styles.contentListTitle}>{p.title}</div>
            <div className={styles.handle}>{p.handle}</div>
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
      <div className={styles.contentLists}>{renderTopContentLists()}</div>
    </Paper>
  )
}

export default TopContentLists
