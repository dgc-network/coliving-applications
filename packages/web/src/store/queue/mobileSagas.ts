import { ID, UID, removeNullable } from '@coliving/common'
import { all, put, select, takeEvery, call } from 'typed-redux-saga/macro'

import { getUserId } from 'common/store/account/selectors'
import { getAgreement } from 'common/store/cache/agreements/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import {
  getOrder,
  getIndex,
  getId as getQueueAgreementId,
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
} from 'services/native-mobile-interface/queue'
import { MessageType, Message } from 'services/native-mobile-interface/types'
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

function* getAgreementInfo(id: ID, uid: UID) {
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return null

  const agreement = yield* select(getAgreement, { id })
  if (!agreement) return null

  const owner = yield* select(getUser, { id: agreement.owner_id })
  if (!owner) return null

  const gateways = owner
    ? getContentNodeIPFSGateways(owner.content_node_endpoint)
    : []

  const imageHash = agreement.cover_art_sizes
    ? `${agreement.cover_art_sizes}/150x150.jpg`
    : agreement.cover_art
  const largeImageHash = agreement.cover_art_sizes
    ? `${agreement.cover_art_sizes}/1000x1000.jpg`
    : agreement.cover_art

  const m3u8Gateways = gateways.concat(PUBLIC_IPFS_GATEWAY)
  const m3u8 = generateM3U8Variants(agreement.agreement_segments, [], m3u8Gateways)
  return {
    title: agreement.title,
    landlord: owner.name,
    artwork: getImageUrl(imageHash!, gateways[0]),
    largeArtwork: getImageUrl(largeImageHash!, gateways[0]),
    uid,
    currentUserId,
    currentListenCount: agreement.play_count,
    isDelete: agreement.is_delete || owner.is_deactivated,
    ownerId: agreement.owner_id,
    agreementId: id,
    id,
    genre: agreement.genre,
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
  const agreements = yield* all(
    queueOrder.map((queueItem: any) => {
      return call(getAgreementInfo, queueItem.id, queueItem.uid)
    })
  )

  const message = new PersistQueueMessage(
    agreements.filter(removeNullable),
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
        id: ${info.agreementId},
        uid: ${info.uid},
        title: ${info.title}`)
      yield* put(updateIndex({ index }))
      // Update currently playing agreement.
      if (!info.isDelete) {
        yield* put(playerActions.set({ uid: info.uid, agreementId: info.agreementId }))
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
    const id = yield* select(getQueueAgreementId)
    if (!id) return

    const agreement = yield* select(getAgreement, { id: id as number })
    if (!agreement) return

    const owner = yield* select(getUser, { id: agreement?.owner_id })
    if (!owner) return

    console.info(`Syncing player: isPlaying ${isPlaying}`)
    if (agreement?.is_delete || owner?.is_deactivated) {
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
      const { genre, agreementId } = action
      const userId = yield* select(getUserId)
      yield* put(
        queueAutoplay({
          genre,
          exclusionList: agreementId ? [agreementId] : [],
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
