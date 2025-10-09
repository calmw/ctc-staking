// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakingNode is ERC1155, AccessControl {
    string public constant name = "CTC staking";

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public constant ZHI_QI = 1; // 智启
    uint256 public constant ZHI_HUI = 2; // 智汇
    uint256 public constant ZHI_CE = 3; // 智策
    uint256 public constant ZHI_DING = 4; // 智鼎

    event URISet(string newURI);

    constructor(string memory uri_) ERC1155(uri_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, "");
    }

    function mintBatch(
        address[] calldata users,
        uint256[] calldata ids,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) {
        require(
            users.length == ids.length && users.length == amounts.length,
            "array length mismatch"
        );
        for (uint256 i = 0; i < users.length; i++) {
            _mint(users[i], ids[i], amounts[i], "");
        }
    }

    function burnFrom(
        address account,
        uint256 id,
        uint256 value
    ) external onlyRole(BURNER_ROLE) {
        _burn(account, id, value);
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
