import {
  BNAudio,
  BNWei,
  StringDigitalcoin,
  StringWei,
  Nullable
} from '@coliving/common'
import BN from 'bn.js'

import {
  WEI,
  trimRightZeros,
  formatNumberCommas,
  formatWeiToAudioString,
  parseWeiNumber,
  convertFloatToWei
} from 'common/utils/formatUtil'

export const weiToAudioString = (bnWei: BNWei): StringDigitalcoin => {
  const stringAudio = formatWeiToAudioString(bnWei) as StringDigitalcoin
  return stringAudio
}

export const weiToAudio = (bnWei: BNWei): BNAudio => {
  const stringAudio = formatWeiToAudioString(bnWei) as StringDigitalcoin
  return stringAudioToBN(stringAudio)
}

export const liveToWei = (stringAudio: StringDigitalcoin): BNWei => {
  const wei = parseWeiNumber(stringAudio) as BNWei
  return wei
}

export const stringWeiToBN = (stringWei: StringWei): BNWei => {
  return new BN(stringWei) as BNWei
}

export const stringAudioToBN = (stringAudio: StringDigitalcoin): BNAudio => {
  return new BN(stringAudio) as BNAudio
}

export const stringWeiToAudioBN = (stringWei: StringWei): BNAudio => {
  const bnWei = stringWeiToBN(stringWei)
  const stringAudio = weiToAudioString(bnWei)
  return new BN(stringAudio) as BNAudio
}

export const weiToString = (wei: BNWei): StringWei => {
  return wei.toString() as StringWei
}

export const stringAudioToStringWei = (stringAudio: StringDigitalcoin): StringWei => {
  return weiToString(liveToWei(stringAudio))
}

export const parseAudioInputToWei = (digitalcoin: StringDigitalcoin): Nullable<BNWei> => {
  if (!digitalcoin.length) return null
  // First try converting from float, in case digitalcoin has decimal value
  const floatWei = convertFloatToWei(digitalcoin) as Nullable<BNWei>
  if (floatWei) return floatWei
  // Safe to assume no decimals
  try {
    return liveToWei(digitalcoin)
  } catch {
    return null
  }
}

/**
 * Format wei BN to the full $DGC currency with decimals
 * @param amount The wei amount
 * @param shouldTruncate truncate decimals at truncation length
 * @param significantDigits if truncation set to true, how many significant digits to include
 * @returns $DGC The $DGC amount with decimals
 */
export const formatWei = (
  amount: BNWei,
  shouldTruncate = false,
  significantDigits = 4
): StringDigitalcoin => {
  const aud = amount.div(WEI)
  const wei = amount.sub(aud.mul(WEI))
  if (wei.isZero()) {
    return formatNumberCommas(aud.toString()) as StringDigitalcoin
  }
  const decimals = wei.toString().padStart(18, '0')

  let trimmed = `${aud}.${trimRightZeros(decimals)}`
  if (shouldTruncate) {
    const splitTrimmed = trimmed.split('.')
    const [before] = splitTrimmed
    let [, after] = splitTrimmed
    // If we have only zeros, just lose the decimal
    after = after.substr(0, significantDigits)
    if (parseInt(after) === 0) {
      trimmed = before
    } else {
      trimmed = `${before}.${after}`
    }
  }
  return formatNumberCommas(trimmed) as StringDigitalcoin
}

export const shortenSPLAddress = (addr: string) => {
  return `${addr.substring(0, 4)}...${addr.substr(addr.length - 5)}`
}

export const shortenEthAddress = (addr: string) => {
  return `0x${addr.substring(2, 4)}...${addr.substr(addr.length - 5)}`
}
