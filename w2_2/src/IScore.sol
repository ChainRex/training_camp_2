// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IScore {
    function setScore(address student, uint256 score) external;
    function getScore(address student) external view returns (uint256);
}
