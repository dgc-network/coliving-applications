/**
 * Helpers to pull important information off of a queue object.
 */

/**
 * Gets the agreement object for the current agreement in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentAgreement(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].agreement
}

/**
 * Gets the agreement object itself (i.e. metadata) for the current agreement in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentAgreementMetadata(queue) {
  if (queue.playingIndex === -1) {
    return null
  }

  const agreement = queue.queue[queue.playingIndex].agreement
  return agreement ? agreement.metadata : null
}

/**
 * Gets the Howler.js object for the current agreement in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentAgreementHowl(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].agreement.live.currentSegment()
}

/**
 * Gets the HTML5 live element for the current agreement in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentAgreementAudioElement(queue) {
  if (
    queue.playingIndex === -1 ||
    !queue.queue[queue.playingIndex].agreement ||
    !queue.queue[queue.playingIndex].agreement.live
  ) {
    return null
  }
  return queue.queue[queue.playingIndex].agreement.live.currentAudioElement()
}

/**
 * Gets the song duration (seconds) for the current agreement in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?number}
 */
export function getCurrentAgreementDuration(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].agreement.live.getDuration()
}

/**
 * Gets the current playback position (seconds) for the current agreement in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?number}
 */
export function getCurrentAgreementPosition(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].position
}

/**
 * Returns whether or not the queue is playing.
 * @param {Object} queue the queue redux store object.
 * @returns {?boolean}
 */
export function isPlaying(queue) {
  return queue.playing
}
