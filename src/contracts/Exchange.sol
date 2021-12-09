pragma solidity ^0.5.0;

import "./Token.sol"; 
import "openzeppelin-solidity/contracts/math/SafeMath.sol"; // Community vetted and trusted!


// TODO:
// [X] Set the Fee Account
// [X] Deposit Ether
// [ ] Withdraw Ether
// [X] Deposit Tokens
// [ ] Withdraw Tokens
// [ ] Check Balances
// [ ] Make Order
// [ ] Cancel Order
// [ ] Fill Order
// [ ] Charge Fees


contract Exchange {
    using SafeMath for uint; // Open Zeppelin is a community trusted and vetted library
    // Variables 
    address public feeAccount; // The account that recvs exchange fees
    uint256 public feePercent; // The fee percent
    address constant  ETHER = address(0); // Stores Ether in tokens mapping with blank address
    // First mapping is for all token address, second is address of the user who deposited said tokens, then it will show the balance
    mapping(address => mapping(address => uint256)) public tokens;

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint amount, uint balance);

    constructor (address _feeAccount, uint256 _feePercent) public {
        // State vs Local variable problem sovled here...
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Fallback: reverts if Ether is sent to this smart contract by mistake
    function() external {
        revert();
    }

    // I need that payable to make this work
    function depositEther() payable public {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function withdrawEther(uint _amount) public {
        require(tokens[ETHER][msg.sender] >= _amount);
        // Thanks to SafeMath, we can make this part easy
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        // Returning Ether
        msg.sender.transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);

    }

    // Keep in mind I have to APPROVE the tokens before calling this. 
    function depositToken(address _token, uint _amount) public {
        require(_token != ETHER);
        // Send tokens to this contract
        require(Token(_token).transferFrom(msg.sender, address(this), _amount)); // 'this' in solidity means this smart contract
        // Updates total tokens in mapping
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint _amount) public {
        // Make sure this is not the Ether address
        require(_token != ETHER);
        require(tokens[_token][msg.sender] >= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);

    }

    function balanceOf(address _token, address user) public view returns (uint256) {
        // Check our balance
        return tokens[_token][user];
    }
}

