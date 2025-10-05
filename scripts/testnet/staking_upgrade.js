const {ethers, upgrades} = require("hardhat")
require('@openzeppelin/hardhat-upgrades')
const {write_contract_address, read_contract_address} = require("../fs");

const perfix = "bsc_testnet_"
const contract_name = "Staking"

async function main() {

    let proxy_address = read_contract_address(perfix + contract_name)

    console.log("ImplementationAddress is", await upgrades.erc1967.getImplementationAddress(proxy_address));
    console.log("ProxyAdmin is", await upgrades.erc1967.getAdminAddress(proxy_address));

    const factory = await ethers.getContractFactory(contract_name);
    const contract = await upgrades.upgradeProxy(proxy_address, factory);

    await contract.deployed();
    console.log("proxy address is ", contract.address)
    console.log("ImplementationAddress is", await upgrades.erc1967.getImplementationAddress(contract.address));
    console.log("ProxyAdmin is", await upgrades.erc1967.getAdminAddress(contract.address));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });