// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is ERC1155, AccessControl {
    string public constant name = "CTC staking";

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    mapping(uint256 => address) public userInfo; // 用户UID => 用户钱包地址

    event URISet(string newURI);
    event Bind(uint256 uid, address user);

    constructor(string memory uri_) ERC1155(uri_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    function mint(
        uint256 uid,
        address user,
        uint256 nodeId,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        require(checkUserInfo(uid, user), "uid and user mismatch");
        _mint(user, nodeId, amount, "");
    }

    function mintBatch(
        uint256[] calldata uids,
        address[] calldata users,
        uint256[] calldata nodeIds,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) {
        require(
            users.length == nodeIds.length && users.length == amounts.length,
            "array length mismatch"
        );
        for (uint256 i = 0; i < users.length; i++) {
            require(checkUserInfo(uids[i], users[i]), "uid and user mismatch");
            _mint(users[i], nodeIds[i], amounts[i], "");
        }
    }

    function burnFrom(
        uint256 uid,
        address user,
        uint256 nodeId,
        uint256 value
    ) external onlyRole(BURNER_ROLE) {
        userInfo[uid] = address(0);
        _burn(user, nodeId, value);
    }

    // 转账限制
    function _updateWithAcceptanceCheck(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) internal virtual override {
        require(
            from == address(0) || to == address(0),
            "Transfers are disabled"
        );
        super._updateWithAcceptanceCheck(from, to, ids, values, data);
    }

    function checkUserInfo(uint256 uid, address user) private returns (bool) {
        address userAddress = userInfo[uid];
        if (userAddress != address(0)) {
            return userAddress == user;
        }
        userInfo[uid] = user;
        emit Bind(uid,user);

        return true;
    }

    function userBalance(
        uint256 uid,
        uint256 nodeId
    ) public view returns (uint256) {
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
