// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/RexToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployRexToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("AMOY_PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 部署实现合约
        RexToken implementation = new RexToken();

        // 编码初始化函数调用（底层是delegatecall）
        bytes memory initializeData = abi.encodeWithSelector(
            RexToken.initialize.selector,
            deployerAddress
        );

        // 部署代理合约,通过代理合约调用实现合约的initialize函数
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initializeData
        );

        // 创建代理的RexToken实例
        RexToken rexToken = RexToken(address(proxy));

        console.log("RexToken proxy deployed at:", address(proxy));
        console.log(
            "RexToken implementation deployed at:",
            address(implementation)
        );
        console.log("RexToken owner:", rexToken.owner());
        console.log("RexToken total supply:", rexToken.totalSupply());

        vm.stopBroadcast();
    }
}
