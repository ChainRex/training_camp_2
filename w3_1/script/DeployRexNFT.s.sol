// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../src/RexNFT.sol";
import "forge-std/Script.sol";

contract DeployRexNFT is Script {
    function run() external returns (RexNFT) {
        vm.startBroadcast();
        RexNFT nft = new RexNFT();
        vm.stopBroadcast();
        return nft;
    }
}
