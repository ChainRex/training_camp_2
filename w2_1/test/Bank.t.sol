// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Test, console} from "forge-std/Test.sol";
import {Bank} from "../src/Bank.sol";
import {DeployBank} from "../script/DeployBank.s.sol";

contract BankTest is Test {
    Bank bank;
    DeployBank deployer;
    address public PLAYER = makeAddr("player");
    uint256 public constant STARTING_USER_BALANCE = 10 ether;

    function setUp() public {
        deployer = new DeployBank();
        bank = deployer.run();
        vm.deal(msg.sender, STARTING_USER_BALANCE);
    }

    function testReceive() public {
        vm.startBroadcast();
        (bool success, ) = address(bank).call{value: 1 ether}("");
        if (success) {
            assertEq(bank.balance(msg.sender), 1 ether);
        }
        vm.stopBroadcast();
    }

    function testWithdraw() public {
        vm.startPrank(PLAYER);
        vm.deal(PLAYER, STARTING_USER_BALANCE);
        (bool success, ) = address(bank).call{value: 1 ether}("");
        if (success) {
            assertEq(bank.balance(PLAYER), 1 ether);
            bank.withdraw();
            assertEq(bank.balance(PLAYER), 0);
        }

        vm.stopPrank();
    }
}
