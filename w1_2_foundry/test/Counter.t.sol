// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {Test, console} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";
import {DeployCounter} from "../script/DeployCounter.s.sol";

contract CounterTest is Test {
    Counter public counter;
    DeployCounter public deployer;

    function setUp() public {
        deployer = new DeployCounter();
        counter = deployer.run();
    }

    // 部署者成功调用 count
    function testDeployerCallCount() public {
        vm.startPrank(msg.sender);
        counter.count();
        assertEq(counter.counter(), 1);
        vm.stopPrank();
    }

    // 非部署者调用 count 失败
    function testNonDeployerCallCount() public {
        vm.startPrank(address(0));
        vm.expectRevert("msg.sender != owner");
        counter.count();
        vm.stopPrank();
    }
}
