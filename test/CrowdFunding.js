const {
  loadFixture,
  mine,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("CrowdFunding", async function () {
  beforeEach(async () => {
    oneETH = ethers.utils.parseEther("1.0");
    [contractOwner, campaignOwner, user] = await ethers.getSigners();
    campaignID = 1;
  });
  async function deployCrowdFundingV1() {
    // Deploy CrowdFundingV1 contract
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
  async function deployCrowdFundingV2() {
    const { crowdfundingv1 } = await loadFixture(deployCrowdFundingV1);

    // Deploy CrowdFundingV2 contract
    const CrowdFundingV2 = await ethers.getContractFactory("CrowdFundingV2");
    const crowdfundingv2 = await upgrades.upgradeProxy(
      crowdfundingv1.address,
      CrowdFundingV2
    );
    await crowdfundingv2.deployed();
    return {
      crowdfundingv2,
    };
  }
  async function deployTokenERC20() {
    // Deploy TokenERC20 contract
    const TokenERC20 = await ethers.getContractFactory("TokenERC20");
    const tokenERC20 = await TokenERC20.deploy();
    await tokenERC20.deployed();

    // Mint 1000000000000000000 tokens to the user
    await tokenERC20.connect(contractOwner).mint(user.address, oneETH);

    return {
      tokenERC20,
    };
  }

  it("=== Successful Campaign ============================================", async function () {
    const { tokenERC20 } = await loadFixture(deployTokenERC20);
    const { crowdfundingv1 } = await loadFixture(deployCrowdFundingV1);

    const campaignOwnerTokenbalanceInitialState = await tokenERC20.balanceOf(
      campaignOwner.address
    );
    const userTokenbalanceInitialState = await tokenERC20.balanceOf(
      user.address
    );
    expect(campaignOwnerTokenbalanceInitialState.toString()).to.be.equal("0");
    expect(userTokenbalanceInitialState.toString()).to.be.equal(oneETH);

    // Approve crowdfundingv1 contract to spend tokens
    await tokenERC20.connect(user).approve(crowdfundingv1.address, oneETH);
    const allowance = await tokenERC20.allowance(
      user.address,
      crowdfundingv1.address
    );
    expect(allowance.toString()).to.be.equal(oneETH);

    // Create Campaign
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const timestamp = block.timestamp;

    const startAt = ethers.BigNumber.from(timestamp + 50);
    const endAt = ethers.BigNumber.from(timestamp + 500);

    const launch = await crowdfundingv1
      .connect(campaignOwner)
      .launch(oneETH, tokenERC20.address, startAt, endAt);
    // dApps using the contract can observe state changes in transaction logs
    await expect(launch).to.emit(crowdfundingv1, "Launch");
    await launch.wait(1);
    await mine(100);

    const campaignInitialState = await crowdfundingv1.campaigns(campaignID);
    expect(campaignInitialState.goal.toString()).to.be.equal(oneETH);

    // Pledged the campaign
    const pledged = await crowdfundingv1
      .connect(user)
      .pledge(campaignID, oneETH);
    // dApps using the contract can observe state changes in transaction logs
    await expect(pledged).to.emit(crowdfundingv1, "Pledge");
    await pledged.wait(1);
    const pledgedAmount = (await crowdfundingv1.campaigns(campaignID)).pledged;
    expect(pledgedAmount.toString()).to.be.equal(oneETH);

    // Owner claim campaign when successful
    await mine(1000);
    const claim = await crowdfundingv1.connect(campaignOwner).claim(campaignID);
    // dApps using the contract can observe state changes in transaction logs
    await expect(claim).to.emit(crowdfundingv1, "Claim");
    await claim.wait(1);
    expect((await crowdfundingv1.campaigns(campaignID)).claimed);

    const userTokenbalanceFinalState = await tokenERC20.balanceOf(user.address);
    expect(userTokenbalanceFinalState.toString()).to.be.equal("0");

    const campaignOwnerTokenbalanceFinalState = await tokenERC20.balanceOf(
      campaignOwner.address
    );
    expect(campaignOwnerTokenbalanceFinalState.toString()).to.be.equal(oneETH);

    const campaignFinalState = await crowdfundingv1.campaigns(campaignID);
    expect(campaignFinalState);

    // ** Create Result Table *********************************

    function State(initialState, finalState) {
      this.initialState = initialState;
      this.finalState = finalState;
    }
    var testTable = {};
    testTable.userTokenbalance = new State(
      userTokenbalanceInitialState.toString(),
      userTokenbalanceFinalState.toString()
    );
    testTable.campaignPledgedAmount = new State(
      campaignInitialState.pledged.toString(),
      campaignFinalState.pledged.toString()
    );
    testTable.claimed = new State(
      campaignInitialState.claimed,
      campaignFinalState.claimed
    );
    testTable.campaignOwnerTokenbalance = new State(
      campaignOwnerTokenbalanceInitialState.toString(),
      campaignOwnerTokenbalanceFinalState.toString()
    );

    console.table(testTable);
  });
  it("=== Failed Campaign ================================================", async function () {
    const { tokenERC20 } = await loadFixture(deployTokenERC20);
    const { crowdfundingv1 } = await loadFixture(deployCrowdFundingV1);

    const campaignOwnerTokenbalanceInitialState = await tokenERC20.balanceOf(
      campaignOwner.address
    );
    const userTokenbalanceInitialState = await tokenERC20.balanceOf(
      user.address
    );
    expect(campaignOwnerTokenbalanceInitialState.toString()).to.be.equal("0");
    expect(userTokenbalanceInitialState.toString()).to.be.equal(oneETH);

    // Approve crowdfundingv1 contract to spend tokens
    await tokenERC20.connect(user).approve(crowdfundingv1.address, oneETH);
    const allowance = await tokenERC20.allowance(
      user.address,
      crowdfundingv1.address
    );
    expect(allowance.toString()).to.be.equal(oneETH);

    // Create Campaign
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const timestamp = block.timestamp;

    const startAt = ethers.BigNumber.from(timestamp + 50);
    const endAt = ethers.BigNumber.from(timestamp + 500);

    const launch = await crowdfundingv1
      .connect(campaignOwner)
      .launch(oneETH, tokenERC20.address, startAt, endAt);
    // dApps using the contract can observe state changes in transaction logs
    await expect(launch).to.emit(crowdfundingv1, "Launch");
    await launch.wait(1);
    await mine(100);

    const campaignInitialState = await crowdfundingv1.campaigns(campaignID);
    expect(campaignInitialState.goal.toString()).to.be.equal(oneETH);

    // Pledged the campaign
    const pledged = await crowdfundingv1
      .connect(user)
      .pledge(1, ethers.utils.parseEther("0.5"));
    // dApps using the contract can observe state changes in transaction logs
    await expect(pledged).to.emit(crowdfundingv1, "Pledge");
    await pledged.wait(1);
    const pledgedAmount = (await crowdfundingv1.campaigns(campaignID)).pledged;
    expect(pledgedAmount.toString()).to.be.equal(
      ethers.utils.parseEther("0.5")
    );

    // Owner refund campaign when falied
    await mine(1000);
    const refund = await crowdfundingv1.connect(user).refund(campaignID);
    // dApps using the contract can observe state changes in transaction logs
    await expect(refund).to.emit(crowdfundingv1, "Refund");
    await refund.wait(1);

    const userTokenbalanceFinalState = await tokenERC20.balanceOf(user.address);
    expect(userTokenbalanceFinalState.toString()).to.be.equal(oneETH);

    const campaignOwnerTokenbalanceFinalState = await tokenERC20.balanceOf(
      campaignOwner.address
    );
    expect(campaignOwnerTokenbalanceFinalState.toString()).to.be.equal("0");

    const campaignFinalState = await crowdfundingv1.campaigns(campaignID);
    expect(campaignFinalState);

    // ** Create Result Table *********************************

    function State(initialState, finalState) {
      this.initialState = initialState;
      this.finalState = finalState;
    }
    var testTable = {};
    testTable.userTokenbalance = new State(
      userTokenbalanceInitialState.toString(),
      userTokenbalanceFinalState.toString()
    );
    testTable.campaignPledgedAmount = new State(
      campaignInitialState.pledged.toString(),
      campaignFinalState.pledged.toString()
    );
    testTable.claimed = new State(
      campaignInitialState.claimed,
      campaignFinalState.claimed
    );
    testTable.campaignOwnerTokenbalance = new State(
      campaignOwnerTokenbalanceInitialState.toString(),
      campaignOwnerTokenbalanceFinalState.toString()
    );

    console.table(testTable);
  });
  it("=== Upgrade Contract ===============================================", async function () {
    const { tokenERC20 } = await loadFixture(deployTokenERC20);
    const { crowdfundingv1 } = await loadFixture(deployCrowdFundingV1);
    const { crowdfundingv2 } = await loadFixture(deployCrowdFundingV2);

    // Approve crowdfundingv1 contract to spend tokens
    await tokenERC20.connect(user).approve(crowdfundingv1.address, oneETH);
    const allowance = await tokenERC20.allowance(
      user.address,
      crowdfundingv1.address
    );
    expect(allowance.toString()).to.be.equal(oneETH);

    // Create Campaign
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const timestamp = block.timestamp;

    const startAt = ethers.BigNumber.from(timestamp + 50);
    const endAt = ethers.BigNumber.from(timestamp + 500);

    const launch = await crowdfundingv1
      .connect(campaignOwner)
      .launch(oneETH, tokenERC20.address, startAt, endAt);
    // dApps using the contract can observe state changes in transaction logs
    await expect(launch).to.emit(crowdfundingv1, "Launch");
    await launch.wait(1);
    await mine(100);

    const campaignInitialState = await crowdfundingv1.campaigns(campaignID);
    expect(campaignInitialState.goal.toString()).to.be.equal(oneETH);

    // Pledged the campaign
    const pledged = await crowdfundingv1
      .connect(user)
      .pledge(campaignID, oneETH);
    // dApps using the contract can observe state changes in transaction logs
    await expect(pledged).to.emit(crowdfundingv1, "Pledge");
    await pledged.wait(1);
    const pledgedAmount = (await crowdfundingv1.campaigns(campaignID)).pledged;
    expect(pledgedAmount.toString()).to.be.equal(oneETH);

    const maxDurationInitialState = await crowdfundingv1.maxDuration();

    const userPledgedAmountInitialState = await crowdfundingv1.pledgedAmount(
      campaignID,
      user.address
    );

    // Set new maxDuration
    await crowdfundingv2.setMaxDuration(100800);
    const maxDurationFinalState = await crowdfundingv2.maxDuration();
    expect(maxDurationFinalState).to.be.equal(100800);

    // pledgedAmount still after upgrade
    const userPledgedAmountFinalState = await crowdfundingv2.pledgedAmount(
      campaignID,
      user.address
    );
    expect(userPledgedAmountInitialState).to.be.equal(
      userPledgedAmountFinalState
    );

    // ** Create Result Table *********************************

    function State(initialState, finalState) {
      this.initialState = initialState;
      this.finalState = finalState;
    }
    var testTable = {};
    testTable.maxDuration = new State(
      maxDurationInitialState.toString(),
      maxDurationFinalState.toString()
    );
    testTable.userPledgedAmount = new State(
      userPledgedAmountInitialState.toString(),
      userPledgedAmountFinalState.toString()
    );
    console.table(testTable);
  });
});
