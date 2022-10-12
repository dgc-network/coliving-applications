import { ID, UID, removeNullable } from '@coliving/common'
import { all, put, select, takeEvery, call } from 'typed-redux-saga/macro'

import { getUserId } from 'common/store/account/selectors'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import {
  getOrder,
  getIndex,
  getId as getQueueDigitalContentId,
  getShuffle,
  getShuffleIndex,
  getShuffleOrder,
  getQueueAutoplay
} from 'common/store/queue/selectors'
import {
  persist,
  queueAutoplay,
  repeat,
  shuffle,
  updateIndex
} from 'common/store/queue/slice'
import {
  PersistQueueMessage,
  RepeatModeMessage,
  ShuffleMessage
} from 'services/nativeMobileInterface/queue'
import { MessageType, Message } from 'services/nativeMobileInterface/types'
import * as playerActions from 'store/player/slice'
import { getContentNodeIPFSGateways } from 'utils/gatewayUtil'
import { generateM3U8Variants } from 'utils/hlsUtil'

const PUBLIC_IPFS_GATEWAY = 'http://cloudflare-ipfs.com/ipfs/'
const DEFAULT_IMAGE_URL =
  'https://download.coliving.lol/static-resources/preview-image.jpg'

const getImageUrl = (cid: string, gateway: string | null): string => {
  if (!cid) return DEFAULT_IMAGE_URL
  return `${gateway}${cid}`
}

function* getDigitalContentInfo(id: ID, uid: UID) {
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return null

  const digital_content = yield* select(getDigitalContent, { id })
  if (!digital_content) return null

  const owner = yield* select(getUser, { id: digital_content.owner_id })
  if (!owner) return null

  const gateways = owner
    ? getContentNodeIPFSGateways(owner.content_node_endpoint)
    : []

  const imageHash = digital_content.cover_art_sizes
    ? `${digital_content.cover_art_sizes}/150x150.jpg`
    : digital_content.cover_art
  const largeImageHash = digital_content.cover_art_sizes
    ? `${digital_content.cover_art_sizes}/1000x1000.jpg`
    : digital_content.cover_art

  const m3u8Gateways = gateways.concat(PUBLIC_IPFS_GATEWAY)
  const m3u8 = generateM3U8Variants(digital_content.digital_content_segments, [], m3u8Gateways)
  return {
    title: digital_content.title,
    author: owner.name,
    artwork: getImageUrl(imageHash!, gateways[0]),
    largeArtwork: getImageUrl(largeImageHash!, gateways[0]),
    uid,
    currentUserId,
    currentListenCount: digital_content.play_count,
    isDelete: digital_content.is_delete || owner.is_deactivated,
    ownerId: digital_content.owner_id,
    digitalContentId: id,
    id,
    genre: digital_content.genre,
    uri: m3u8
  }
}

function* persistQueue() {
  const queueOrder: ReturnType<typeof getOrder> = yield* select(getOrder)
  const queueIndex: ReturnType<typeof getIndex> = yield* select(getIndex)
  const shuffle: ReturnType<typeof getShuffle> = yield* select(getShuffle)
  const shuffleIndex: ReturnType<typeof getShuffleIndex> = yield* select(
    getShuffleIndex
  )
  const shuffleOrder: ReturnType<typeof getShuffleOrder> = yield* select(
    getShuffleOrder
  )
  const queueAutoplay: ReturnType<typeof getQueueAutoplay> = yield* select(
    getQueueAutoplay
  )
  const digitalContents = yield* all(
    queueOrder.map((queueItem: any) => {
      return call(getDigitalContentInfo, queueItem.id, queueItem.uid)
    })
  )

  const message = new PersistQueueMessage(
    digitalContents.filter(removeNullable),
    queueIndex,
    shuffle,
    shuffleIndex,
    shuffleOrder,
    queueAutoplay
  )
  message.send()
}

function* watchPersist() {
  yield* takeEvery(persist.type, function* () {
    yield* call(persistQueue)
  })
}

function* watchRepeat() {
  yield* takeEvery(repeat.type, (action: any) => {
    const message = new RepeatModeMessage(action.payload.mode)
    message.send()
  })
}

function* watchShuffle() {
  yield* takeEvery(shuffle.type, function* (action: any) {
    const shuffle: ReturnType<typeof getShuffle> = yield* select(getShuffle)
    const shuffleIndex: ReturnType<typeof getShuffleIndex> = yield* select(
      getShuffleIndex
    )
    const shuffleOrder: ReturnType<typeof getShuffleOrder> = yield* select(
      getShuffleOrder
    )
    const message = new ShuffleMessage(shuffle, shuffleIndex, shuffleOrder)
    message.send()
  })
}

function* watchSyncQueue() {
  yield* takeEvery(MessageType.SYNC_QUEUE, function* (action: Message) {
    const currentIndex = yield* select(getIndex)
    const { index, info } = action
    if (info) {
      console.info(`
        Syncing queue:
        index: ${index},
        id: ${info.digitalContentId},
        uid: ${info.uid},
        title: ${info.title}`)
      yield* put(updateIndex({ index }))
      // Update currently playing digital_content.
      if (!info.isDelete) {
        yield* put(playerActions.set({ uid: info.uid, digitalContentId: info.digitalContentId }))
      } else {
        yield* put(playerActions.stop({}))
      }
      // Only change the play counter for a different song
      if (index !== currentIndex) {
        yield* put(playerActions.incrementCount())
      }
    }
  })
}

function* watchSyncPlayer() {
  yield* takeEvery(MessageType.SYNC_PLAYER, function* (action: Message) {
    const { isPlaying, incrementCounter } = action
    const id = yield* select(getQueueDigitalContentId)
    if (!id) return

    const digital_content = yield* select(getDigitalContent, { id: id as number })
    if (!digital_content) return

    const owner = yield* select(getUser, { id: digital_content?.owner_id })
    if (!owner) return

    console.info(`Syncing player: isPlaying ${isPlaying}`)
    if (digital_content?.is_delete || owner?.is_deactivated) {
      yield* put(playerActions.stop({}))
    } else if (isPlaying) {
      yield* put(playerActions.playSucceeded({}))
    } else {
      yield* put(playerActions.pause({ onlySetState: true }))
    }
    if (incrementCounter) {
      yield* put(playerActions.incrementCount())
    }
  })
}

export function* watchRequestQueueAutoplay() {
  yield* takeEvery(
    MessageType.REQUEST_QUEUE_AUTOPLAY,
    function* (action: Message) {
      const { genre, digitalContentId } = action
      const userId = yield* select(getUserId)
      yield* put(
        queueAutoplay({
          genre,
          exclusionList: digitalContentId ? [digitalContentId] : [],
          currentUserId: userId
        })
      )
    }
  )
}

const sagas = () => {
  return [
    watchPersist,
    watchRepeat,
    watchSyncQueue,
    watchSyncPlayer,
    watchShuffle,
    watchRequestQueueAutoplay
  ]
}

export default sagas
