// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract TokenERC20 is ERC20, Ownable, ERC20Permit {
    constructor() ERC20("ERC20", "ERC") ERC20Permit("ERC20") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
