import { expect } from "chai"

export const EVM_REVERT = 'VM Exception while processing transaction: revert'

export const ether = (n) => {
    // Now I dont have to multiply everything by 10**18.
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
}

// Same as ether
export const tokens = (n) => ether(n)

export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'