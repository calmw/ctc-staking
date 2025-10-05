// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./interface/IStaking.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is IStaking, AccessControl, Initializable {
    using Address for address;

    bytes32 public constant EX_ROLE = keccak256("EX_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address payable public exAddress; // 接受释放的地址
    mapping(uint256 => NodeInfo) public node; // 节点ID=>节点信息
    mapping(bytes32 => mapping(uint256 => uint256)) public userStaking; // userId=>(nodeType=>buyNumber) 用户ID,节点类型,购买数量

    function initialize() public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // 设置接受释放资产的地址
    function adminSetExAddress(address _exAddress) public onlyRole(ADMIN_ROLE) {
        exAddress = payable(_exAddress);
    }

    // 设置节点信息
    function adminSetNodeInfo(
        uint256 nodeId,
        string calldata nodeName,
        string calldata nodeIcon,
        string calldata nodeDescription
    ) public onlyRole(ADMIN_ROLE) {
        node[nodeId] = NodeInfo(nodeId, nodeName, nodeIcon, nodeDescription);
    }

    // 用户质押节点
    function stake(
        uint256 nodeId,
        bytes32 userId,
        uint256 number
    ) external onlyRole(EX_ROLE) {
        userStaking[userId][nodeId] += number;
        emit Stake(userId, nodeId, number);
    }

    // 节点释放收益
    function release(uint256 amount) external onlyRole(ADMIN_ROLE) {
        Address.sendValue(payable(exAddress), amount);
        emit Release(exAddress, amount);
    }

    // 获取用户加密后的用户ID
    function getKeccak256UserId(
        string calldata userId
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(userId));
    }
}
