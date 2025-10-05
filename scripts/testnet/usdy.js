const {ethers} = require("hardhat")
const {BigNumber} = require("ethers");
const {write_contract_address} = require("../fs");


const perfix = "ctc_testnet_"
const contract_name = "Usdy"

async function main() {

    const contract = await ethers.getContractFactory(contract_name)
    console.log("Deploying .........")

    const contractObj = await contract.deploy('USDY', 'USDY', '0xDd41168e4F79BBFF5decF7C60c68549E76d8f633', BigNumber.from(6));
    // 等待部署完成
    await contractObj.deployed();
    console.log("contract deployed to:", contractObj.address);
    write_contract_address(perfix + contract_name, contractObj.address)

    const name = await contractObj.name();
    const symbol = await contractObj.symbol();
    const decimals = await contractObj.decimals();
    const totalSupply = await contractObj.totalSupply();

    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Total Supply: ${ethers.utils.formatUnits(totalSupply, decimals)}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });