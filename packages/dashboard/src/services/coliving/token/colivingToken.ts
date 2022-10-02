import { ColivingClient } from '../colivingClient'

import { Address, BigNumber } from 'types'

export default class ColivingToken {
  aud: ColivingClient

  constructor(aud: ColivingClient) {
    this.aud = aud
  }

  getContract() {
    return this.aud.libs.ethContracts.ColivingTokenClient
  }

  async balanceOf(account: Address): Promise<BigNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().balanceOf(account)
    return info
  }
}
