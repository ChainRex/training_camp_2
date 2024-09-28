// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../src/RexToken.sol";
import "forge-std/Script.sol";

contract DeployRexToken is Script {
    function run() external returns (RexToken) {
        vm.startBroadcast();
        RexToken token = new RexToken();
        vm.stopBroadcast();
        return token;
    }
}
