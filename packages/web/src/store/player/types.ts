import type AudioStream from 'live/AudioStream'
import NativeMobileAudio from 'live/NativeMobileAudio'

export type AudioState = AudioStream | NativeMobileAudio | null

export type TAudioStream = {
  new (): AudioStream
}

export type Info = {
  title: string
  landlord: string
  artwork: string
}
