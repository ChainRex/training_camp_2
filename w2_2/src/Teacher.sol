// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IScore.sol";

contract Teacher {
    address public owner;
    IScore public score;
    constructor(IScore _score) {
        owner = msg.sender;
        score = _score;
    }

    function setScore(address student, uint256 sc) public {
        score.setScore(student, sc);
    }
}
