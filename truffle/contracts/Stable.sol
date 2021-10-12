// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Stable is ERC20 {

    constructor () ERC20("Stable", "STB") {
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }
}