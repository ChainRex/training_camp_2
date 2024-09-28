// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {RexNFT} from "../src/RexNFT.sol";
import {Script} from "forge-std/Script.sol";

contract DeployRexNFT is Script {
    function run() external returns (RexNFT) {
        vm.startBroadcast();
        RexNFT nft = new RexNFT();
        vm.stopBroadcast();
        return nft;
    }
}
