const { expect } = require("chai");
const hre = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Counter", function () {
  // 部署者成功调用count
  it("Depolyer should be able to call count", async function () {
    const counter = await hre.ethers.deployContract("Counter", [0]);
    await counter.count();
    expect(await counter.counter()).to.equal(1);
  });

  // 非部署者调用count失败
  it("Non-deployer should not be able to call count", async function () {
    const [deployer, other] = await hre.ethers.getSigners();
    const counter = await hre.ethers.deployContract("Counter", [0]);
    expect(await counter.owner()).to.equal(deployer.address);
    expect(counter.connect(other).count()).to.be.reverted;
  });


  // it("Should set the right unlockTime", async function () {
  //   const lockedAmount = 1_000_000_000;
  //   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  //   const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

  //   // deploy a lock contract where funds can be withdrawn
  //   // one year in the future
  //   const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
  //     value: lockedAmount,
  //   });

  //   // assert that the value is correct
  //   expect(await lock.unlockTime()).to.equal(unlockTime);
  // });
});