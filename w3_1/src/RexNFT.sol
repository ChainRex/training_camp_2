// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RexNFT is ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor() ERC721("RexNFT", "RNFT") {}

    function mint(address to, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }
}
