// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {Teacher} from "../src/Teacher.sol";
import {Score} from "../src/Score.sol";

contract DeployTeacher is Script {
    function run() external returns (Teacher) {
        vm.startBroadcast();
        Score score = new Score();
        Teacher teacher = new Teacher(score);
        score.setTeacher(address(teacher));
        vm.stopBroadcast();
        return teacher;
    }
}
