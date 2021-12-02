export const EVM_REVERT = 'VM Exception while processing transaction: revert'

export const tokens = (n) => {
    // Now I dont have to multiply everything by 10**18.
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
}