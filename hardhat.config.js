require('@openzeppelin/hardhat-upgrades')
require("@nomiclabs/hardhat-waffle");
const PRIVATE_KEY = process.env.CTC_USDY
module.exports = {
    solidity: "0.8.22",
    settings: {
        optimizer: {
            enabled: true,
            runs: 2000
        }
    },
    networks: {
        ctc_test: {
            url: "https://test-rpc.ctcchain.com",
            accounts: [`${PRIVATE_KEY}`],
            gasPrice: 7110504285714
        },
        ctc: {
            url: "https://rpc.ctcchain.com",
            accounts: [`${PRIVATE_KEY}`],
            gasPrice: 7110504285714
        }
    }
}
