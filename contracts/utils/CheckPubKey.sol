pragma ton-solidity 0.59.0;

import "../libraries/_ErrorCodes.sol";

contract CheckPubKey {
    modifier checkPubKey() {
        require(msg.pubkey() == tvm.pubkey(), _ErrorCodes.DIFFERENT_PUB_KEYS);
        _;
    }
}