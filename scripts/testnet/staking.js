const {ethers} = require("hardhat")
const {BigNumber} = require("ethers");
const {write_contract_address} = require("../fs");


const perfix = "ctc_testnet_"
const contract_name = "Staking"

async function main() {
    const contract = await ethers.getContractFactory(contract_name)
    console.log("Deploying .........")

    const contractObj = await contract.deploy('');
    // 等待部署完成
    await contractObj.deployed();
    console.log("contract deployed to:", contractObj.address);
    write_contract_address(perfix + contract_name, contractObj.address)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });