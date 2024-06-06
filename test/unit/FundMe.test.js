const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers } = require("hardhat")
const { describe } = require("node:test")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          // const sendValue = "1000000000000000000" // 1 ETH
          const sendValue = ethers.parseEther("1")
          beforeEach(async function () {
              // deploy contract
              // using hardhat deploy
              // const accounts = await ethers.getSigners()
              // const accountOne = accounts[0]
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target)
              })
          })

          describe("fund", function () {
              it("Failed if your don't set enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })

              it("Updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunders(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", function () {
              it("withdraw ETH from a single founder", async function () {
                  await fundMe.fund({ value: sendValue })
                  // Arrang
                  const startingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe)
                  const startingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Act
                  const txReponse = await fundMe.withdraw()
                  const txReceipt = await txReponse.wait(1)
                  const { gasUsed, gasPrice } = txReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe)
                  const endingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })
              it("withdraw ETH from multiple founders", async function () {
                  await fundMe.fund({ value: sendValue })

                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe)
                  const startingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, gasPrice } = txReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe)
                  const endingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance +
                          startingDeployerBalance +
                          BigInt(Number(sendValue) * Number(5)),
                      endingDeployerBalance + gasCost
                  )

                  // make sure that the funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0
                      )
                  }
              })
              it("only allows the owner to withdraw", async function () {
                  await fundMe.fund({ value: sendValue })
                  // const accounts = await ethers.getSigners()
                  // const attacker = accounts[1]
                  // const attackerConnectedContract = await fundMe.connect(attacker)
                  // await expect(
                  //     attackerConnectedContract.withdraw()
                  // ).to.be.revertedWith("FundMe__NotOwner")

                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })

          describe("cheaperWithdraw", function () {
              it("withdraw ETH from a single founder", async function () {
                  await fundMe.fund({ value: sendValue })
                  // Arrang
                  const startingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe)
                  const startingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Act
                  const txReponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txReponse.wait(1)
                  const { gasUsed, gasPrice } = txReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe)
                  const endingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })
              it("withdraw ETH from multiple founders", async function () {
                  await fundMe.fund({ value: sendValue })

                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe)
                  const startingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Act
                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, gasPrice } = txReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe)
                  const endingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance +
                          startingDeployerBalance +
                          BigInt(Number(sendValue) * Number(5)),
                      endingDeployerBalance + gasCost
                  )

                  // make sure that the funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0
                      )
                  }
              })
              it("only allows the owner to withdraw", async function () {
                  await fundMe.fund({ value: sendValue })
                  // const accounts = await ethers.getSigners()
                  // const attacker = accounts[1]
                  // const attackerConnectedContract = await fundMe.connect(attacker)
                  // await expect(
                  //     attackerConnectedContract.withdraw()
                  // ).to.be.revertedWith("FundMe__NotOwner")

                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      fundMeConnectedContract.cheaperWithdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
      })
