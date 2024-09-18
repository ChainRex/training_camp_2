// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Bank {
    mapping(address => uint) public balance;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "msg.sender != owner");
        _;
    }

    receive() external payable {
        balance[msg.sender] += msg.value;
    }

    function withdraw() public {
        (bool success, ) = msg.sender.call{value: balance[msg.sender]}("");
        require(success, "Transfer failed.");
        balance[msg.sender] = 0;
    }

    function withdrawAll() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
