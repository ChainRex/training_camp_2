// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IScore} from "./IScore.sol";

contract Score is IScore {
    mapping(address => uint256) public scores;
    address public teacher;

    error OnlyTeacher();
    error ScoreOutOfBounds();

    constructor() {
        teacher = msg.sender;
    }

    modifier onlyTeacher() {
        if (msg.sender != teacher) revert OnlyTeacher();
        _;
    }

    function setScore(address student, uint256 score) public onlyTeacher {
        if (score > 100) revert ScoreOutOfBounds();
        scores[student] = score;
    }

    function getScore(address student) public view returns (uint256) {
        return scores[student];
    }

    function setTeacher(address _teacher) public onlyTeacher {
        teacher = _teacher;
    }
}
