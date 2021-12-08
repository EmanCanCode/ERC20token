pragma solidity ^0.5.0;

// TODO:
// [X] Set the Fee Account
// [ ] Deposit Ether
// [ ] Withdraw Ether
// [ ] Deposit Tokens
// [ ] Withdraw Tokens
// [ ] Check Balances
// [ ] Make Order
// [ ] Cancel Order
// [ ] Fill Order
// [ ] Charge Fees


contract Exchange {
    // Variables 
    address public feeAccount; // The account that recvs exchange fees

    constructor (address _feeAccount) public {
        // State vs Local variable problem soled here...
        feeAccount = _feeAccount;
    }
}

