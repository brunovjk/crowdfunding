const {
  loadFixture,
  mine,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("CrowdFunding", async function () {
  let oneETH;
  let owner;
  let otherAccount;
  beforeEach(async () => {
    oneETH = ethers.utils.parseEther("1.0");
    [owner, otherAccount] = await ethers.getSigners();
  });
  async function deployCrowdFundingV1() {
    const CrowdFundingV1 = await ethers.getContractFactory("CrowdFundingV1");
    const crowdfundingv1 = await upgrades.deployProxy(
      CrowdFundingV1,
      [50400 /* maxDuration ~ 1 week */],
      {
        initializer: "initialize",
        kind: "transparent",
      }
    );
    await crowdfundingv1.deployed();
    return {
      crowdfundingv1,
    };
  }
  async function deployTokenERC20() {
    const TokenERC20 = await ethers.getContractFactory("TokenERC20");
    const tokenERC20 = await TokenERC20.deploy();
    await tokenERC20.deployed();
    return {
      tokenERC20,
    };
  }
  it("=== Successful Campaign ==================================================", async function () {
    const { tokenERC20 } = await loadFixture(deployTokenERC20);
    const { crowdfundingv1 } = await loadFixture(deployCrowdFundingV1);

    // Mint 1000000000000000000 tokens to the user (otherAccount)
    await tokenERC20.connect(owner).mint(otherAccount.address, oneETH);
    const ownerTokenbalanceInitialState = await tokenERC20.balanceOf(
      owner.address
    );
    const userTokenbalanceInitialState = await tokenERC20.balanceOf(
      otherAccount.address
    );
    expect(userTokenbalanceInitialState.toString()).to.be.equal(
      "1000000000000000000"
    );
    // Approve crowdfundingv1 contract to spend tokens
    await tokenERC20
      .connect(otherAccount)
      .approve(crowdfundingv1.address, oneETH);
    const allowance = await tokenERC20.allowance(
      otherAccount.address,
      crowdfundingv1.address
    );
    expect(allowance.toString()).to.be.equal("1000000000000000000");
    // Create Campaign
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const timestamp = block.timestamp;

    const startAt = ethers.BigNumber.from(timestamp + 50);
    const endAt = ethers.BigNumber.from(timestamp + 500);

    const launch = await crowdfundingv1
      .connect(owner)
      .launch(oneETH, tokenERC20.address, startAt, endAt);
    // dApps using the contract can observe state changes in transaction logs
    await expect(launch).to.emit(crowdfundingv1, "Launch");
    await launch.wait(1);
    await mine(100);

    const campaignInitialState = await crowdfundingv1.campaigns(1);
    expect(campaignInitialState.goal.toString()).to.be.equal(
      "1000000000000000000"
    );
    // Pledged the campaign
    const pledged = await crowdfundingv1
      .connect(otherAccount)
      .pledge(1, oneETH);
    // dApps using the contract can observe state changes in transaction logs
    await expect(pledged).to.emit(crowdfundingv1, "Pledge");
    await pledged.wait(1);
    const pledgedAmount = (await crowdfundingv1.campaigns(1)).pledged;
    expect(pledgedAmount.toString()).to.be.equal("1000000000000000000");

    // Owner claim campaign funds if successful
    await mine(1000);
    const claim = await crowdfundingv1.connect(owner).claim(1);
    // dApps using the contract can observe state changes in transaction logs
    await expect(claim).to.emit(crowdfundingv1, "Claim");
    await claim.wait(1);
    expect((await crowdfundingv1.campaigns(1)).claimed);

    const userTokenbalanceFinalState = await tokenERC20.balanceOf(
      otherAccount.address
    );
    const ownerTokenbalanceFinalState = await tokenERC20.balanceOf(
      owner.address
    );
    const campaignFinalState = await crowdfundingv1.campaigns(1);

    // *****************************************************

    function State(initialState, finalState) {
      this.initialState = initialState;
      this.finalState = finalState;
    }
    var testTable = {};
    testTable.userTokenbalance = new State(
      userTokenbalanceInitialState.toString(),
      userTokenbalanceFinalState.toString()
    );
    testTable.pledgedAmount = new State(
      campaignInitialState.pledged.toString(),
      campaignFinalState.pledged.toString()
    );
    testTable.claimed = new State(
      campaignInitialState.claimed,
      campaignFinalState.claimed
    );
    testTable.ownerTokenbalance = new State(
      ownerTokenbalanceInitialState.toString(),
      ownerTokenbalanceFinalState.toString()
    );

    console.table(testTable);
  });
});
