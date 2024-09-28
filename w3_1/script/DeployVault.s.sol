// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../src/Vault.sol";
import "forge-std/Script.sol";
import "../src/RexToken.sol";
import "./DeployRexToken.s.sol";

contract DeployVault is Script {
    function run() external returns (Vault) {
        DeployRexToken deployRexToken = new DeployRexToken();
        RexToken token = deployRexToken.run();
        vm.startBroadcast();

        Vault vault = new Vault(address(token));
        vm.stopBroadcast();
        return vault;
    }
}
