import Hls from 'hls.js'

import AudioStream from 'audio/AudioStream'

jest.mock('hls.js', () => {
  const hls = jest.fn().mockImplementation(() => ({
    loadSource: jest.fn(),
    attachMedia: jest.fn(),
    on: jest.fn()
  }))
  hls.DefaultConfig = {
    loader: jest.fn().mockImplementation(() => {})
  }
  hls.isSupported = jest.fn().mockReturnValue(true)
  hls.Events = { ERROR: jest.fn() }
  return {
    __esModule: true,
    default: hls
  }
})

beforeAll(() => {
  global.AudioContext = jest.fn().mockImplementation(() => ({
    createMediaElementSource: jest.fn().mockReturnValue({
      connect: jest.fn()
    }),
    createGain: jest.fn().mockReturnValue({
      connect: jest.fn(),
      gain: {
        value: 1,
        exponentialRampToValueAtTime: jest.fn()
      }
    })
  }))
  global.URL = {
    createObjectURL: jest.fn()
  }
  // Set timeouts to resolve instantly.
  global.setTimeout = jest.fn().mockImplementation((cb) => {
    cb()
  })
})

describe('load hls.js', () => {
  let segments
  let liveStream
  beforeEach(() => {
    segments = [
      {
        duration: '6',
        multihash: 'a'
      },
      {
        duration: '6',
        multihash: 'b'
      },
      {
        duration: '6',
        multihash: 'c'
      }
    ]
    liveStream = new AudioStream()
  })

  it('loads segments with hlsjs', () => {
    liveStream.load(segments, () => {})

    expect(liveStream.hls.loadSource).toBeCalled()
    expect(liveStream.hls.attachMedia).toBeCalledWith(liveStream.live)
    expect(liveStream.duration).toEqual(18)
  })
})

describe('load native hls', () => {
  let segments
  let liveStream
  beforeEach(() => {
    Hls.isSupported = jest.fn().mockReturnValue(false)

    segments = [
      {
        duration: '6',
        multihash: 'a'
      },
      {
        duration: '6',
        multihash: 'b'
      },
      {
        duration: '6',
        multihash: 'c'
      }
    ]
    liveStream = new AudioStream()
  })

  it('loads segments with native hls', () => {
    liveStream.load(segments, () => {})

    expect(liveStream.live.src).toEqual(
      expect.stringContaining('data:application/vnd.apple.mpegURL;')
    )
    expect(liveStream.duration).toEqual(18)
  })

  it('sets up event listeners', () => {
    const onEnd = jest.fn()
    liveStream.load(segments, onEnd)
    const onBufferingChange = jest.fn()
    liveStream.onBufferingChange = onBufferingChange

    liveStream.live.dispatchEvent(new Event('waiting'))
    expect(liveStream.buffering).toEqual(true)
    expect(onBufferingChange).toBeCalledWith(true)

    liveStream.live.dispatchEvent(new Event('canplay'))
    expect(liveStream.buffering).toEqual(false)
    expect(onBufferingChange).toBeCalledWith(false)

    liveStream.live.dispatchEvent(new Event('ended'))
    expect(onEnd).toBeCalled()
  })
})

describe('play', () => {
  it('plays', () => {
    const play = jest.fn()
    global.Audio = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      play
    }))
    const liveStream = new AudioStream()
    liveStream.load([{ duration: 6 }], () => {})
    liveStream.play()

    expect(play).toBeCalled()
  })
})

describe('pause', () => {
  it('pauses', () => {
    const pause = jest.fn()
    global.Audio = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn().mockImplementation((event, cb) => {
        cb()
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      pause
    }))
    const liveStream = new AudioStream()
    liveStream.load([{ duration: 6 }], () => {})
    liveStream.pause()

    expect(pause).toBeCalled()
  })
})

describe('stop', () => {
  it('stops', () => {
    const pause = jest.fn()
    global.Audio = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      pause
    }))
    const liveStream = new AudioStream()
    liveStream.load([{ duration: 6 }], () => {})
    liveStream.stop()

    expect(pause).toBeCalled()
    setTimeout(() => {
      expect(liveStream.live.currentTime).toEqual(0)
    }, 0)
  })
})
