// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

contract DeployCounter is Script {
    function run() public returns (Counter) {
        vm.startBroadcast();

        Counter counter = new Counter(0);

        vm.stopBroadcast();

        return counter;
    }
}
