// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract RexToken is ERC20, ERC20Permit {
    constructor() ERC20("RexToken", "REX") ERC20Permit("RexToken") {
        _mint(msg.sender, 100000 * 10 ** decimals());
    }
}
