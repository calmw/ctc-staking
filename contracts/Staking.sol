// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is ERC1155, AccessControl {
    string public constant name = "CTC staking";

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public constant ZHI_QI = 1; // 智启
    uint256 public constant ZHI_HUI = 2; // 智汇
    uint256 public constant ZHI_CE = 3; // 智策
    uint256 public constant ZHI_DING = 4; // 智鼎

    mapping(uint256 => address) public userInfo; // 用户UID => 用户钱包地址

    event URISet(string newURI);

    constructor(string memory uri_) ERC1155(uri_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    function mint(
        uint256 uid,
        address user,
        uint256 id,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        require(checkUserInfo(uid, user), "uid and user mismatch");
        _mint(user, id, amount, "");
    }

    function mintBatch(
        uint256[] calldata uids,
        address[] calldata users,
        uint256[] calldata ids,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) {
        require(
            users.length == ids.length && users.length == amounts.length,
            "array length mismatch"
        );
        for (uint256 i = 0; i < users.length; i++) {
            require(checkUserInfo(uids[i], users[i]), "uid and user mismatch");
            _mint(users[i], ids[i], amounts[i], "");
        }
    }

    function burnFrom(
        uint256 uid,
        address user,
        uint256 id,
        uint256 value
    ) external onlyRole(BURNER_ROLE) {
        userInfo[uid] = address(0);
        _burn(user, id, value);
    }

    function checkUserInfo(uint256 uid, address user) private returns (bool) {
        address userAddress = userInfo[uid];
        if (userAddress != address(0)) {
            return userAddress == user;
        }
        userInfo[uid] = user;

        return true;
    }

    function userBalance(
        uint256 uid,
        uint256 nodeId
    ) private returns (uint256) {
        address userAddress = userInfo[uid];
        if (userAddress == address(0)) {
            return 0;
        }
        return balanceOf(userAddress, nodeId);
    }

    function setURI(
        string calldata newuri
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newuri);
        emit URISet(newuri);
    }

    // -------------------
    // Overrides required by Solidity (multiple inheritance)
    // -------------------
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
