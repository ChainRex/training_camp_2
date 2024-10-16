// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/RexTokenV2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract UpgradeRexToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("AMOY_PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        // 代理合约地址（请替换为实际部署的代理地址）
        address proxyAddress = 0xBeE9D04dC8c3409cd37231409A2b2c30dDD2F522;
        address ownerAddress = 0x79C1E3B3A648592DC66e5FD93617b016d6f41Cd8;

        vm.startBroadcast(deployerPrivateKey);

        // 部署新的实现合约
        RexTokenV2 newImplementation = new RexTokenV2();

        // 获取代理合约的实例
        RexTokenV2 proxy = RexTokenV2(proxyAddress);

        // 升级到新的实现并调用初始化函数
        bytes memory initializeData = abi.encodeWithSelector(
            RexTokenV2.initialize.selector,
            ownerAddress
        );
        proxy.upgradeToAndCall(address(newImplementation), initializeData);

        console.log("RexToken upgraded to V2");
        console.log("New implementation address:", address(newImplementation));
        console.log("Proxy address (unchanged):", address(proxy));
        console.log("RexToken owner:", proxy.owner());

        vm.stopBroadcast();
    }
}
