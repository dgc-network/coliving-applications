/**
 * Helpers to pull important information off of a queue object.
 */

/**
 * Gets the digital_content object for the current digital_content in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentAgreement(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].digital_content
}

/**
 * Gets the digital_content object itself (i.e. metadata) for the current digital_content in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentAgreementMetadata(queue) {
  if (queue.playingIndex === -1) {
    return null
  }

  const digital_content = queue.queue[queue.playingIndex].digital_content
  return digital_content ? digital_content.metadata : null
}

/**
 * Gets the Howler.js object for the current digital_content in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentAgreementHowl(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].digital_content.digitalcoin.currentSegment()
}

/**
 * Gets the HTML5 digitalcoin element for the current digital_content in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentAgreementAudioElement(queue) {
  if (
    queue.playingIndex === -1 ||
    !queue.queue[queue.playingIndex].digital_content ||
    !queue.queue[queue.playingIndex].digital_content.digitalcoin
  ) {
    return null
  }
  return queue.queue[queue.playingIndex].digital_content.digitalcoin.currentAudioElement()
}

/**
 * Gets the song duration (seconds) for the current digital_content in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?number}
 */
export function getCurrentAgreementDuration(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].digital_content.digitalcoin.getDuration()
}

/**
 * Gets the current playback position (seconds) for the current digital_content in the queue.
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
