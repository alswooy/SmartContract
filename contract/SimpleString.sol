// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimpleStorage {
    string private storedData;
    event DataUpdated(string oldValue, string newValue);

    function set(string calldata x) external {
        emit DataUpdated(storedData, x);
        storedData = x;
    }

    function get() external view returns (string memory) {
        return storedData;
    }
}
