pragma ton-solidity 0.59.0;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./libraries/TokenErrors.sol";
import "./utils/RandomNonce.sol";

contract Token20 {

    uint static  _nonce;
    
    string internal   _name;
    string internal  _symbol;
    uint8 internal  _decimals;
    uint128 internal  _totalSupply;
    
    mapping (address=>uint128)internal  _balances;
    mapping (address=> mapping (address=>uint128))internal _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // Modifier that allows public function to accept external calls only from the contract owner.
    modifier onlyOwnerAndAccept {
		require(tvm.pubkey() == msg.pubkey(), TokenErrors.NOT_AN_OWNER);
		tvm.accept();
		_;
	}

    constructor(string name_, string symbol_, uint8 decimals_, uint128 totalSupply_) public {

        // check that contract's public key is set
        require(tvm.pubkey() != 0, 101); 
        // Check that message has signature (msg.pubkey() is not zero) and message is signed with the owner's private key
		require(msg.pubkey() == tvm.pubkey(), 102);
        tvm.accept();
        require(decimals_ < 19, TokenErrors.Max_ESCEED_DECIMALS);
        
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _totalSupply = totalSupply_;
        
    }

    //getter functions

    function name() external view responsible  returns (string ) {
        return { value: 0, bounce: false, flag: 64 } _name;
    }

    function symbol() external view responsible  returns (string ) {
        return { value: 0, bounce: false, flag: 64 }  _symbol;
    }

     function decimals() external view responsible  returns (uint8) {
        return { value: 0, bounce: false, flag: 64 }  _decimals;
    }

    function totalSupply()  external view responsible  returns (uint128) {
        return { value: 0, bounce: false, flag: 64 }  _totalSupply;
    } 

    function balanceOf(address account)external view responsible returns (uint128){
        return { value: 0, bounce: false, flag: 64 } _balances[account];
    }

    //external functions

    function transfer( address to, uint128 amount)external  returns(bool){

        uint128 fromBalance = _balances[msg.sender];
        require(fromBalance >= amount, TokenErrors.AMOUNT_EXCEEDS_BALANCE);
        _balances[msg.sender] = fromBalance - amount;
         _balances[to] += amount;
         emit Transfer(msg.sender, to, amount);
        return true;
        
    }

    function allowance( address spender, uint128 amount) external  responsible returns(uint128){
        return { value: 0, bounce: false, flag: 64 } _allowances[msg.sender][spender] = amount;
    }

   
    function aprove(address spender, uint128 amount)external  returns(bool){
        
        _aprove(msg.sender, spender, amount);
        return true;

    }

    function transferFrom(address from, address to, uint128 amount)external returns(bool){

        uint128 fromBalance = _balances[from];
        require(fromBalance >= amount, TokenErrors.AMOUNT_EXCEEDS_BALANCE);
        _balances[from] = fromBalance - amount;
         _balances[to] += amount;

         uint128 currentAllowance = _allowances[from][msg.sender];
         require(from == msg.sender || amount <= currentAllowance, TokenErrors.INSUFFICIENT_APPROVAL);
         _aprove(from, msg.sender, currentAllowance - amount);

         return true;
    }

    function mint(uint128 amount, address account) external {
        require(amount > 0, TokenErrors.NOT_ENOUGH_FUNDS);
        require(tvm.pubkey() == msg.pubkey(), TokenErrors.NOT_AN_OWNER);
		tvm.accept();
        
        _totalSupply += amount;
        _balances[account] += amount;
    }

    function burn(uint128 amount, address account)external onlyOwnerAndAccept(){
        uint128 accountBalance = _balances[account];
        require(accountBalance >= amount, TokenErrors.AMOUNT_EXCEEDS_BALANCE);
        _balances[account] = accountBalance - amount;
        _totalSupply -= amount;

    }

    //internal functions

    function _aprove(address owner, address spender, uint128 amount)internal {
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}

    

   

    