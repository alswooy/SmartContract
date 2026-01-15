// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimpleMap {
    mapping(string => string) private store;

    event DataUpdated(string key, string oldValue, string newValue);

    function set(string calldata x, string calldata y) external {
        string memory oldValue = store[x];
        
        emit DataUpdated(x, oldValue, y);
        
        store[x] = y;
    }

    function get(string calldata x) external view returns (string memory) {
        return store[x];
    }
}