const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Contract", function () {
    let staking;
    let owner;
    let minter;
    let burner;
    let user1;
    let user2;
    let user3;

    const ZHI_QI = 1;
    const ZHI_HUI = 2;
    const ZHI_CE = 3;
    const ZHI_DING = 4;

    beforeEach(async function () {
        [owner, minter, burner, user1, user2, user3] = await ethers.getSigners();
        
        const Staking = await ethers.getContractFactory("Staking");
        staking = await Staking.deploy("https://api.example.com/metadata/{id}.json");
        await staking.deployed();

        // 设置角色
        await staking.grantRole(await staking.MINTER_ROLE(), minter.address);
        await staking.grantRole(await staking.BURNER_ROLE(), burner.address);
    });

    // 构造函数和初始化测试
    // - 合约名称设置
    // - URI 设置
    // - 初始角色分配
    // - 代币常量定义
    describe("Constructor and Initialization", function () {
        it("Should set the correct name", async function () {
            expect(await staking.name()).to.equal("CTC staking");
        });

        it("Should set the correct URI", async function () {
            expect(await staking.uri(1)).to.equal("https://api.example.com/metadata/{id}.json");
        });

        it("Should grant initial roles to owner", async function () {
            expect(await staking.hasRole(await staking.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
            expect(await staking.hasRole(await staking.MINTER_ROLE(), owner.address)).to.be.true;
            expect(await staking.hasRole(await staking.BURNER_ROLE(), owner.address)).to.be.true;
        });

        it("Should have correct token constants", async function () {
            expect(await staking.ZHI_QI()).to.equal(ZHI_QI);
            expect(await staking.ZHI_HUI()).to.equal(ZHI_HUI);
            expect(await staking.ZHI_CE()).to.equal(ZHI_CE);
            expect(await staking.ZHI_DING()).to.equal(ZHI_DING);
        });
    });

    // 角色管理测试
    // - 角色授权
    // - 角色撤销
    // - 权限验证
    // - 未授权访问拒绝
    describe("Role Management", function () {
        it("Should allow admin to grant roles", async function () {
            await staking.grantRole(await staking.MINTER_ROLE(), user1.address);
            expect(await staking.hasRole(await staking.MINTER_ROLE(), user1.address)).to.be.true;
        });

        it("Should allow admin to revoke roles", async function () {
            await staking.revokeRole(await staking.MINTER_ROLE(), minter.address);
            expect(await staking.hasRole(await staking.MINTER_ROLE(), minter.address)).to.be.false;
        });

        it("Should not allow non-admin to grant roles", async function () {
            await expect(
                staking.connect(user1).grantRole(await staking.MINTER_ROLE(), user2.address)
            ).to.be.revertedWith(/AccessControlUnauthorizedAccount/);
        });

        it("Should not allow non-admin to revoke roles", async function () {
            await expect(
                staking.connect(user1).revokeRole(await staking.MINTER_ROLE(), minter.address)
            ).to.be.revertedWith(/AccessControlUnauthorizedAccount/);
        });
    });

    // 铸造功能测试
    // - 单个代币铸造
    // - 批量代币铸造
    // - UID 绑定逻辑
    // - 权限控制
    // - 输入验证
    describe("Minting", function () {
        it("Should allow minter to mint tokens", async function () {
            const uid = 12345;
            const amount = 100;
            
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
            
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(amount);
            expect(await staking.userInfo(uid)).to.equal(user1.address);
        });

        it("Should not allow non-minter to mint tokens", async function () {
            const uid = 12345;
            const amount = 100;
            
            await expect(
                staking.connect(user1).mint(uid, user1.address, ZHI_QI, amount)
            ).to.be.revertedWith(/AccessControlUnauthorizedAccount/);
        });

        it("Should handle UID binding correctly", async function () {
            const uid = 12345;
            const amount = 100;
            
            // First mint - should bind UID to user
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
            expect(await staking.userInfo(uid)).to.equal(user1.address);
            
            // Second mint with same UID and user - should work
            await staking.connect(minter).mint(uid, user1.address, ZHI_HUI, amount);
            expect(await staking.balanceOf(user1.address, ZHI_HUI)).to.equal(amount);
            
            // Third mint with same UID but different user - should fail
            await expect(
                staking.connect(minter).mint(uid, user2.address, ZHI_CE, amount)
            ).to.be.revertedWith("uid and user mismatch");
        });

        it("Should allow batch minting", async function () {
            const uids = [12345, 12346, 12347];
            const users = [user1.address, user2.address, user3.address];
            const ids = [ZHI_QI, ZHI_HUI, ZHI_CE];
            const amounts = [100, 200, 300];
            
            await staking.connect(minter).mintBatch(uids, users, ids, amounts);
            
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(100);
            expect(await staking.balanceOf(user2.address, ZHI_HUI)).to.equal(200);
            expect(await staking.balanceOf(user3.address, ZHI_CE)).to.equal(300);
        });

        it("Should revert batch minting with mismatched array lengths", async function () {
            const uids = [12345, 12346];
            const users = [user1.address, user2.address, user3.address];
            const ids = [ZHI_QI, ZHI_HUI];
            const amounts = [100, 200];
            
            await expect(
                staking.connect(minter).mintBatch(uids, users, ids, amounts)
            ).to.be.revertedWith("array length mismatch");
        });
    });

    // 销毁功能测试
    // - 代币销毁
    // - UID 绑定清理
    // - 权限控制
    describe("Burning", function () {
        beforeEach(async function () {
            // Setup: mint some tokens first
            const uid = 12345;
            const amount = 100;
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
        });

        it("Should allow burner to burn tokens", async function () {
            const uid = 12345;
            const burnAmount = 50;
            
            await staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, burnAmount);
            
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(50);
            expect(await staking.userInfo(uid)).to.equal(ethers.constants.AddressZero);
        });

        it("Should not allow non-burner to burn tokens", async function () {
            const uid = 12345;
            const burnAmount = 50;
            
            await expect(
                staking.connect(user1).burnFrom(uid, user1.address, ZHI_QI, burnAmount)
            ).to.be.revertedWith(/AccessControlUnauthorizedAccount/);
        });

        it("Should clear UID binding after burning", async function () {
            const uid = 12345;
            const burnAmount = 100;
            
            await staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, burnAmount);
            
            // UID should be cleared
            expect(await staking.userInfo(uid)).to.equal(ethers.constants.AddressZero);
            
            // userBalance should return 0 for cleared UID
            expect(await staking.userBalance(uid, ZHI_QI)).to.equal(0);
        });
    });

    // 转账限制测试
    // - 用户间转账禁止
    // - 批量转账禁止
    // - 铸造操作允许
    // - 销毁操作允许
    describe("Transfer Restrictions", function () {
        beforeEach(async function () {
            // Setup: mint some tokens
            const uid = 12345;
            const amount = 100;
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
        });

        it("Should not allow transfers between users", async function () {
            await expect(
                staking.connect(user1).safeTransferFrom(user1.address, user2.address, ZHI_QI, 50, "0x")
            ).to.be.revertedWith("Transfers are disabled");
        });

        it("Should not allow batch transfers between users", async function () {
            await expect(
                staking.connect(user1).safeBatchTransferFrom(
                    user1.address, 
                    user2.address, 
                    [ZHI_QI], 
                    [50], 
                    "0x"
                )
            ).to.be.revertedWith("Transfers are disabled");
        });

        it("Should allow minting (from address(0))", async function () {
            const uid = 12346;
            const amount = 50;
            
            await staking.connect(minter).mint(uid, user2.address, ZHI_HUI, amount);
            expect(await staking.balanceOf(user2.address, ZHI_HUI)).to.equal(amount);
        });

        it("Should allow burning (to address(0))", async function () {
            const uid = 12345;
            const burnAmount = 50;
            
            await staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, burnAmount);
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(50);
        });
    });

    // 用户管理测试
    // - 用户余额查询
    // - UID 状态管理
    // - 非存在 UID 处理
    describe("User Management", function () {
        it("Should track user balance correctly", async function () {
            const uid = 12345;
            const amount = 100;
            
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
            
            expect(await staking.userBalance(uid, ZHI_QI)).to.equal(amount);
        });

        it("Should return 0 for non-existent UID", async function () {
            const uid = 99999;
            
            expect(await staking.userBalance(uid, ZHI_QI)).to.equal(0);
        });

        it("Should return 0 for cleared UID", async function () {
            const uid = 12345;
            const amount = 100;
            
            // Mint tokens
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
            expect(await staking.userBalance(uid, ZHI_QI)).to.equal(amount);
            
            // Burn all tokens (clears UID)
            await staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, amount);
            expect(await staking.userBalance(uid, ZHI_QI)).to.equal(0);
        });
    });

    // URI 管理测试
    // - URI 更新
    // - 权限控制
    // - 事件发射
    describe("URI Management", function () {
        it("Should allow admin to set URI", async function () {
            const newURI = "https://new-api.example.com/metadata/{id}.json";
            
            await staking.setURI(newURI);
            expect(await staking.uri(1)).to.equal(newURI);
        });

        it("Should not allow non-admin to set URI", async function () {
            const newURI = "https://new-api.example.com/metadata/{id}.json";
            
            await expect(
                staking.connect(user1).setURI(newURI)
            ).to.be.revertedWith(/AccessControlUnauthorizedAccount/);
        });

        it("Should emit URISet event", async function () {
            const newURI = "https://new-api.example.com/metadata/{id}.json";
            
            await expect(staking.setURI(newURI))
                .to.emit(staking, "URISet")
                .withArgs(newURI);
        });
    });

    // 接口支持测试
    // - ERC1155 接口
    // - AccessControl 接口
    describe("Interface Support", function () {
        it("Should support ERC1155 interface", async function () {
            const ERC1155_INTERFACE_ID = "0xd9b67a26";
            expect(await staking.supportsInterface(ERC1155_INTERFACE_ID)).to.be.true;
        });

        it("Should support AccessControl interface", async function () {
            const ACCESS_CONTROL_INTERFACE_ID = "0x7965db0b";
            expect(await staking.supportsInterface(ACCESS_CONTROL_INTERFACE_ID)).to.be.true;
        });
    });

    // 边界情况测试
    // - 零数量铸造
    // - 超额销毁
    // - 无效代币 ID
    describe("Edge Cases", function () {
        it("Should handle zero amount minting", async function () {
            const uid = 12345;
            const amount = 0;
            
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(0);
        });

        it("Should handle burning more than balance", async function () {
            const uid = 12345;
            const mintAmount = 100;
            const burnAmount = 150;
            
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, mintAmount);
            
            await expect(
                staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, burnAmount)
            ).to.be.revertedWith(/ERC1155InsufficientBalance/);
        });

        it("Should handle invalid token IDs", async function () {
            const uid = 12345;
            const amount = 100;
            const invalidId = 999;
            
            await staking.connect(minter).mint(uid, user1.address, invalidId, amount);
            expect(await staking.balanceOf(user1.address, invalidId)).to.equal(amount);
        });
    });
});
