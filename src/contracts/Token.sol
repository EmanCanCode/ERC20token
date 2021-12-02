pragma solidity^0.5.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Token {
    using SafeMath for uint;
    
    // Variables
    string public name = "The Great Reset";
    string public symbol = "TGR";
    uint256 public decimals = 18;
    uint256 public totalSupply;
     // Track balances (stores info)
    mapping(address => uint256) public balanceOf;
    // Track allowances
    mapping(address => mapping(address => uint256)) public allowance;
    // Send Tokens (behavior/functionality)
    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);



    constructor() public {
        totalSupply = 1000000 * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        // Makes sure deployer only sends what they have
        require(balanceOf[msg.sender] >= _value);
        _transfer(msg.sender, _to, _value);
        return true;
    }

    // an internal function
    function _transfer(address _from, address _to, uint256 _value) internal {
        // Makes sure the recipient is valid
        require(_to != address(0));
        // Subtract senders balance
        balanceOf[_from] = balanceOf[_from].sub(_value);
        // Add balance of the _to
        balanceOf[_to] = balanceOf[_to].add(_value);
        // Call event
        emit Transfer(_from, _to, _value);
    }

    // Approve tokens
    function approve(address _spender, uint256 _value) public returns (bool success) {
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    // Transfer from 
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balanceOf[_from]);
        require(_value <= allowance[_from][msg.sender]);
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        _transfer(_from, _to, _value);
        return true;
    }







}
