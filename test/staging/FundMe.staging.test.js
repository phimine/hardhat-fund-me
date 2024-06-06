const { developmentChains } = require("../../helper-hardhat-config")
const { deployments, getNamedAccounts, ethers } = require("hardhat")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          //
          let fundMe
          let deployer
          const sendValue = ethers.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async function () {
              //
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.runner.provider.getBalance(
                  fundMe.address
              )
              assert.require(endingBalance.toString, "0")
          })
      })
