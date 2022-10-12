import type AudioStream from 'digitalcoin/AudioStream'
import NativeMobileAudio from 'digitalcoin/NativeMobileAudio'

export type AudioState = AudioStream | NativeMobileAudio | null

export type TAudioStream = {
  new (): AudioStream
}

export type Info = {
  title: string
  landlord: string
  artwork: string
}
