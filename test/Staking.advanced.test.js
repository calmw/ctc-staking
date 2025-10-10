const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Contract - Advanced Tests", function () {
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

    // 复杂 UID 管理测试
    // - 多 UID 用户处理
    // - UID 重新绑定
    // - 部分销毁和 UID 持久性
    describe("Complex UID Management", function () {
        it("Should handle multiple UIDs for same user", async function () {
            const uid1 = 12345;
            const uid2 = 12346;
            const amount = 100;
            
            await staking.connect(minter).mint(uid1, user1.address, ZHI_QI, amount);
            await staking.connect(minter).mint(uid2, user1.address, ZHI_HUI, amount);
            
            expect(await staking.userInfo(uid1)).to.equal(user1.address);
            expect(await staking.userInfo(uid2)).to.equal(user1.address);
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(amount);
            expect(await staking.balanceOf(user1.address, ZHI_HUI)).to.equal(amount);
        });

        it("Should handle UID rebinding after burning", async function () {
            const uid = 12345;
            const amount = 100;
            
            // First mint and burn
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
            await staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, amount);
            
            // UID should be cleared
            expect(await staking.userInfo(uid)).to.equal(ethers.constants.AddressZero);
            
            // Should be able to rebind UID to different user
            await staking.connect(minter).mint(uid, user2.address, ZHI_HUI, amount);
            expect(await staking.userInfo(uid)).to.equal(user2.address);
        });

        it("Should handle partial burning and UID persistence", async function () {
            const uid = 12345;
            const mintAmount = 100;
            const burnAmount = 50;
            
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, mintAmount);
            await staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, burnAmount);
            
            // UID should be cleared even with partial burn
            expect(await staking.userInfo(uid)).to.equal(ethers.constants.AddressZero);
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(50);
        });
    });

    // 批量操作边界情况测试
    // - 空批量操作
    // - 大批量操作
    // - 混合代币类型批量操作
    describe("Batch Operations Edge Cases", function () {
        it("Should handle empty batch operations", async function () {
            const uids = [];
            const users = [];
            const ids = [];
            const amounts = [];
            
            await staking.connect(minter).mintBatch(uids, users, ids, amounts);
            // Should not revert
        });

        it("Should handle large batch operations", async function () {
            const batchSize = 10;
            const uids = [];
            const users = [];
            const ids = [];
            const amounts = [];
            
            for (let i = 0; i < batchSize; i++) {
                uids.push(12345 + i);
                users.push(user1.address);
                ids.push(ZHI_QI);
                amounts.push(100);
            }
            
            await staking.connect(minter).mintBatch(uids, users, ids, amounts);
            
            for (let i = 0; i < batchSize; i++) {
                expect(await staking.userInfo(12345 + i)).to.equal(user1.address);
            }
        });

        it("Should handle mixed token types in batch", async function () {
            const uids = [12345, 12346, 12347, 12348];
            const users = [user1.address, user2.address, user3.address, user1.address];
            const ids = [ZHI_QI, ZHI_HUI, ZHI_CE, ZHI_DING];
            const amounts = [100, 200, 300, 400];
            
            await staking.connect(minter).mintBatch(uids, users, ids, amounts);
            
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(100);
            expect(await staking.balanceOf(user2.address, ZHI_HUI)).to.equal(200);
            expect(await staking.balanceOf(user3.address, ZHI_CE)).to.equal(300);
            expect(await staking.balanceOf(user1.address, ZHI_DING)).to.equal(400);
        });
    });

    // 角色管理场景测试
    // - 角色转移
    // - 多角色持有者
    // - 角色放弃
    describe("Role Management Scenarios", function () {
        it("Should handle role transfer", async function () {
            // Grant minter role to user1
            await staking.grantRole(await staking.MINTER_ROLE(), user1.address);
            
            // User1 should be able to mint
            await staking.connect(user1).mint(12345, user2.address, ZHI_QI, 100);
            expect(await staking.balanceOf(user2.address, ZHI_QI)).to.equal(100);
            
            // Revoke role from user1
            await staking.revokeRole(await staking.MINTER_ROLE(), user1.address);
            
            // User1 should not be able to mint anymore
            await expect(
                staking.connect(user1).mint(12346, user2.address, ZHI_HUI, 100)
            ).to.be.revertedWith(/AccessControlUnauthorizedAccount/);
        });

        it("Should handle multiple role holders", async function () {
            // Grant minter role to multiple users
            await staking.grantRole(await staking.MINTER_ROLE(), user1.address);
            await staking.grantRole(await staking.MINTER_ROLE(), user2.address);
            
            // Both should be able to mint
            await staking.connect(user1).mint(12345, user3.address, ZHI_QI, 100);
            await staking.connect(user2).mint(12346, user3.address, ZHI_HUI, 200);
            
            expect(await staking.balanceOf(user3.address, ZHI_QI)).to.equal(100);
            expect(await staking.balanceOf(user3.address, ZHI_HUI)).to.equal(200);
        });

        it("Should handle role renunciation", async function () {
            // Grant minter role to user1
            await staking.grantRole(await staking.MINTER_ROLE(), user1.address);
            
            // User1 should be able to mint
            await staking.connect(user1).mint(12345, user2.address, ZHI_QI, 100);
            
            // User1 renounces the role
            await staking.connect(user1).renounceRole(await staking.MINTER_ROLE(), user1.address);
            
            // User1 should not be able to mint anymore
            await expect(
                staking.connect(user1).mint(12346, user2.address, ZHI_HUI, 100)
            ).to.be.revertedWith(/AccessControlUnauthorizedAccount/);
        });
    });

    // Gas 优化测试
    // - 铸造 Gas 使用量
    // - 批量铸造 Gas 使用量
    describe("Gas Optimization Tests", function () {
        it("Should measure gas usage for minting", async function () {
            const uid = 12345;
            const amount = 100;
            
            const tx = await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
            const receipt = await tx.wait();
            
            console.log(`Mint gas used: ${receipt.gasUsed.toString()}`);
            expect(receipt.gasUsed.toNumber()).to.be.lessThan(100000); // Should be reasonable
        });

        it("Should measure gas usage for batch minting", async function () {
            const uids = [12345, 12346, 12347];
            const users = [user1.address, user2.address, user3.address];
            const ids = [ZHI_QI, ZHI_HUI, ZHI_CE];
            const amounts = [100, 200, 300];
            
            const tx = await staking.connect(minter).mintBatch(uids, users, ids, amounts);
            const receipt = await tx.wait();
            
            console.log(`Batch mint gas used: ${receipt.gasUsed.toString()}`);
            expect(receipt.gasUsed.toNumber()).to.be.lessThan(200000); // Should be reasonable
        });
    });

    // 事件发射测试
    // - TransferSingle 事件
    // - TransferBatch 事件
    // - 自定义事件
    describe("Event Emission Tests", function () {
        it("Should emit TransferSingle event on mint", async function () {
            const uid = 12345;
            const amount = 100;
            
            await expect(staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount))
                .to.emit(staking, "TransferSingle")
                .withArgs(minter.address, ethers.constants.AddressZero, user1.address, ZHI_QI, amount);
        });

        it("Should emit events on batch mint", async function () {
            const uids = [12345, 12346];
            const users = [user1.address, user2.address];
            const ids = [ZHI_QI, ZHI_HUI];
            const amounts = [100, 200];
            
            // OpenZeppelin ERC1155 emits events for batch operations
            const tx = await staking.connect(minter).mintBatch(uids, users, ids, amounts);
            const receipt = await tx.wait();
            
            // Check that events were emitted (should have at least one event)
            expect(receipt.events.length).to.be.greaterThan(0);
        });

        it("Should emit TransferSingle event on burn", async function () {
            const uid = 12345;
            const amount = 100;
            
            // First mint
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
            
            // Then burn
            await expect(staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, amount))
                .to.emit(staking, "TransferSingle")
                .withArgs(burner.address, user1.address, ethers.constants.AddressZero, ZHI_QI, amount);
        });
    });

    // 安全边界情况测试
    // - 零地址处理
    // - 最大值处理
    // - 溢出保护
    describe("Security Edge Cases", function () {
        it("Should handle zero address in mint", async function () {
            const uid = 12345;
            const amount = 100;
            
            await expect(
                staking.connect(minter).mint(uid, ethers.constants.AddressZero, ZHI_QI, amount)
            ).to.be.revertedWith(/ERC1155InvalidReceiver/);
        });

        it("Should handle zero address in batch mint", async function () {
            const uids = [12345];
            const users = [ethers.constants.AddressZero];
            const ids = [ZHI_QI];
            const amounts = [100];
            
            await expect(
                staking.connect(minter).mintBatch(uids, users, ids, amounts)
            ).to.be.revertedWith(/ERC1155InvalidReceiver/);
        });

        it("Should handle zero address in burn", async function () {
            const uid = 12345;
            const amount = 100;
            
            await expect(
                staking.connect(burner).burnFrom(uid, ethers.constants.AddressZero, ZHI_QI, amount)
            ).to.be.revertedWith(/ERC1155InvalidSender/);
        });

        it("Should handle maximum uint256 values", async function () {
            const uid = 12345;
            const maxAmount = ethers.constants.MaxUint256;
            
            // This should work without overflow
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, maxAmount);
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(maxAmount);
        });
    });

    // 集成测试
    // - 完整用户生命周期
    // - 多代币类型支持
    describe("Integration Tests", function () {
        it("Should handle complete user lifecycle", async function () {
            const uid = 12345;
            const amount = 1000;
            
            // 1. User starts with no balance
            expect(await staking.userBalance(uid, ZHI_QI)).to.equal(0);
            
            // 2. Mint tokens
            await staking.connect(minter).mint(uid, user1.address, ZHI_QI, amount);
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(amount);
            expect(await staking.userBalance(uid, ZHI_QI)).to.equal(amount);
            
            // 3. Partial burn
            const burnAmount = 300;
            await staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, burnAmount);
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(amount - burnAmount);
            expect(await staking.userBalance(uid, ZHI_QI)).to.equal(0); // UID cleared
            
            // 4. Complete burn
            await staking.connect(burner).burnFrom(uid, user1.address, ZHI_QI, amount - burnAmount);
            expect(await staking.balanceOf(user1.address, ZHI_QI)).to.equal(0);
            
            // 5. UID can be reused
            await staking.connect(minter).mint(uid, user2.address, ZHI_HUI, amount);
            expect(await staking.userInfo(uid)).to.equal(user2.address);
        });

        it("Should handle multiple token types for same user", async function () {
            const uid = 12345;
            const amounts = [100, 200, 300, 400];
            const tokenIds = [ZHI_QI, ZHI_HUI, ZHI_CE, ZHI_DING];
            
            // Mint different token types
            for (let i = 0; i < tokenIds.length; i++) {
                await staking.connect(minter).mint(uid, user1.address, tokenIds[i], amounts[i]);
            }
            
            // Check balances
            for (let i = 0; i < tokenIds.length; i++) {
                expect(await staking.balanceOf(user1.address, tokenIds[i])).to.equal(amounts[i]);
                expect(await staking.userBalance(uid, tokenIds[i])).to.equal(amounts[i]);
            }
        });
    });
});
