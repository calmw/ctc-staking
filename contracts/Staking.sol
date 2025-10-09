// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @notice ERC-1155 with AccessControl, minting, burning and per-id totalSupply tracking
/// @dev Uses OpenZeppelin Contracts
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RoleBasedERC1155 is
    ERC1155,
    ERC1155Burnable,
    ERC1155Supply,
    AccessControl
{
    /// Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// Optional name/symbol metadata (not part of ERC-1155 standard)
    string public name;
    string public symbol;

    /// Events (optional, ERC1155 already emits TransferSingle/Batch)
    event URISet(string newURI);

    /**
     * @param _name token collection name (optional)
     * @param _symbol token collection symbol (optional)
     * @param uri_  base URI (ERC1155 URI, may include {id})
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory uri_
    ) ERC1155(uri_) {
        name = _name;
        symbol = _symbol;

        // Grant deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // By default, give deployer minter & burner for convenience
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
    }

    // -------------------
    // Minting functions
    // -------------------

    /// @notice Mint `amount` of token `id` to `to`. Only accounts with MINTER_ROLE can call.
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, data);
    }

    /// @notice Batch mint multiple ids/amounts to `to`. Only MINTER_ROLE.
    function mintBatch(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external onlyRole(MINTER_ROLE) {
        _mintBatch(to, ids, amounts, data);
    }

    // -------------------
    // Burning by role
    // -------------------

    /// @notice Burn tokens from `account` by an authorized burner. Requires BURNER_ROLE.
    /// @dev This allows operator-like burning (e.g., moderator can burn user tokens).
    function burnFrom(
        address account,
        uint256 id,
        uint256 value
    ) external onlyRole(BURNER_ROLE) {
        _burn(account, id, value);
    }

    /// @notice Batch burn from account by burner role
    function burnFromBatch(
        address account,
        uint256[] calldata ids,
        uint256[] calldata values
    ) external onlyRole(BURNER_ROLE) {
        _burnBatch(account, ids, values);
    }

    // -------------------
    // URI management
    // -------------------

    /// @notice Update the base URI (admin only)
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

    /// @dev Hook required by ERC1155Supply and ERC1155
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
