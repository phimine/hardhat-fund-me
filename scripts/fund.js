const { getNamedAccounts, deployments, ethers } = require("hardhat")

async function main() {
    //
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding...")
    const txResponse = await fundMe.fund({ value: ethers.parseEther("0.1") })
    await txResponse.wait(1)
    console.log("Funded!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
