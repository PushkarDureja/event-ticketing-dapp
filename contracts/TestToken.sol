// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title TEST token smart contract.
/// @notice Warning! This is only for testing!
/// @dev Warning! This is only for testing!
contract TestToken is ERC20("Test", "TEST") {
  /// @param _initialSupply Initial supply of the token.
  /// @param _decimals Number of decimal points.
  constructor(uint _initialSupply, uint8 _decimals) {
    _mint(msg.sender, _initialSupply);
    _setupDecimals(_decimals);
  }
}
