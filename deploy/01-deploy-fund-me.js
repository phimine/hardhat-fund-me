// imports
// main function
// calling of main function

const { getNamedAccounts, deployments, network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig

const { verify } = require("../utils/verify")

// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre
//     // hre.getNamedAccounts()
//     // hre.deployments()
// }

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    console.log(`chainId is ${chainId}`)

    // if chainId is X use address Y
    // if chainId is Z use address A
    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // if the contract doesn't exist, we deploy a minimal versoom of for our local testing

    // what happens when we want to change chains
    // when going for localhost or hardhat network, we want to use a mock
    const contractArgs = [ethUsdPriceFeedAddress]
    console.log(`price feed address is : ${contractArgs}`)
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: contractArgs,
        log: true,
        // waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // verify contract
        await verify(fundMe.address, contractArgs)
    }

    log("FundMe deployed!=====================================")
}

module.exports.tags = ["all", "fundme"]
