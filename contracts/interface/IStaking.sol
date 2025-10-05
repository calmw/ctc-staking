// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IStaking {
    //    enum AssetsType {
    //        None,
    //        Coin,
    //        Erc20,
    //        Erc721,
    //        Erc1155
    //    }

    event Stake(
        bytes32 indexed userId, // 用户Id
        uint256 indexed nodeId, // 节点Id
        uint256 indexed number // 购买节点数量
    );

    event Release(
        address indexed exAddress, // 资产接受地址
        uint256 indexed amount // 释放数量
    );

    // 节点信息
    struct NodeInfo {
        uint256 nodeId; // 节点Id
        string nodeName; // 节点名称
        string nodeIcon; // 节点Icon
        string nodeDescription; // 节点描述
    }
}
