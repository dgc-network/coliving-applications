import { useCallback, useEffect } from 'react'

import { setIsCasting } from '-client/src/common/store/cast/slice'
import {
  CastState,
  useCastState,
  useRemoteMediaClient,
  useStreamPosition
} from 'react-native-google-cast'
import { useSelector } from 'react-redux'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { getAgreement, getPlaying, getSeek } from 'app/store/live/selectors'

export const useChromecast = () => {
  const dispatchWeb = useDispatchWeb()

  // Data hooks
  const agreement = useSelector(getAgreement)
  const playing = useSelector(getPlaying)
  const seek = useSelector(getSeek)

  // Cast hooks
  const client = useRemoteMediaClient()
  const castState = useCastState()
  const streamPosition = useStreamPosition(0.5)

  const loadCast = useCallback(
    (agreement, startTime) => {
      if (client && agreement) {
        client.loadMedia({
          mediaInfo: {
            contentUrl: agreement.uri,
            contentType: 'application/vnd.apple.mpegurl',
            metadata: {
              type: 'musicAgreement',
              images: [
                {
                  url: agreement.largeArtwork
                }
              ],
              title: agreement.title,
              artist: agreement.artist
            }
          },
          startTime
        })
      }
    },
    [client]
  )

  const playCast = useCallback(() => {
    client?.play()
  }, [client])

  const pauseCast = useCallback(() => {
    client?.pause()
  }, [client])

  // Update our cast UI when the cast device connects
  useEffect(() => {
    switch (castState) {
      case CastState.CONNECTED:
        dispatchWeb(setIsCasting({ isCasting: true }))
        break
      default:
        dispatchWeb(setIsCasting({ isCasting: false }))
        break
    }
  }, [castState, dispatchWeb])

  // Load media when the cast connects
  useEffect(() => {
    if (castState === CastState.CONNECTED) {
      loadCast(agreement, global.progress.currentTime ?? 0)
    }
  }, [loadCast, agreement, castState])

  // Play & pause the cast device
  useEffect(() => {
    if (castState === CastState.CONNECTED) {
      if (playing) {
        playCast()
      } else {
        pauseCast()
      }
    }
  }, [playing, playCast, pauseCast, castState])

  // Update the  seek with the stream position from
  // the cast device
  useEffect(() => {
    if (streamPosition !== null) {
      global.progress.currentTime = streamPosition
    }
  }, [streamPosition])

  // Seek the cast device
  useEffect(() => {
    if (seek !== null) {
      client?.seek({ position: seek })
    }
  }, [client, seek])

  return {
    isCasting: castState === CastState.CONNECTED
  }
}
