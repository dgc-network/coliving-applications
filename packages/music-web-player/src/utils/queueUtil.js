/**
 * Helpers to pull important information off of a queue object.
 */

/**
 * Gets the digital_content object for the current digital_content in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentDigitalContent(queue) {
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
export function getCurrentDigitalContentMetadata(queue) {
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
export function getCurrentDigitalContentHowl(queue) {
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
export function getCurrentDigitalContentAudioElement(queue) {
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
export function getCurrentDigitalContentDuration(queue) {
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
export function getCurrentDigitalContentPosition(queue) {
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
