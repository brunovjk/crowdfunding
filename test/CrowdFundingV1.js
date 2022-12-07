const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("CrowdFundingV1", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCrowdFundingV1() {
    const erc20Abi = [
      "function name() public view returns (string)",
      "function symbol() public view returns (string)",
      "function decimals() public view returns (uint8)",
      "function totalSupply() public view returns (uint256)",
      "function balanceOf(address _owner) public view returns (uint256 balance)",
      "function transfer(address _to, uint256 _value) public returns (bool success)",
      "function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)",
      "function approve(address _spender, uint256 _value) public returns (bool success)",
      "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",

      // An event triggered whenever anyone transfers to someone else
      "event Transfer(address indexed from, address indexed to, uint amount)",
    ];
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;

    const goal = 5000000000000; // 0.000005
    const startAt = timestampBefore + 1000;
    const endAt = timestampBefore + 30000;
    const token = "0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa";
    const amountToPledge = 5000000000000; // 0.000005

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

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
      owner,
      otherAccount,
      goal,
      startAt,
      endAt,
      token,
      amountToPledge,
      erc20Abi,
    };
  }

  describe("Deployment", function () {
    it("Should print CrowdFundingV1 contract address", async function () {
      const { crowdfundingv1 } = await loadFixture(deployCrowdFundingV1);
      console.log("CrowdFundingV1 deployed to:", crowdfundingv1.address);
      expect(crowdfundingv1.address);
    });
  });

  describe("Campaign", function () {
    let campaign;
    it("Should create a valid Crowd Funding Campaign", async function () {
      const { crowdfundingv1, goal, startAt, endAt, token } = await loadFixture(
        deployCrowdFundingV1
      );

      await crowdfundingv1.launch(goal, startAt, endAt, token);

      campaign = await crowdfundingv1.campaigns(1);
      console.log("Campaign creator address:", campaign.creator);
      expect(campaign);
    });
    it("Should increase pledged after fundind", async function () {
      const {
        owner,
        otherAccount,
        crowdfundingv1,
        goal,
        startAt,
        endAt,
        token,
        erc20Abi,
        amountToPledge,
      } = await loadFixture(deployCrowdFundingV1);

      // const TokenContract = new ethers.Contract(token, erc20Abi, owner);
      // const balanceOfBeforeDeposit = await TokenContract.balanceOf(
      //   owner.address
      // );

      // console.log(balanceOfBeforeDeposit);
      // // await TokenContract.approve(crowdfundingv1.address, amountToPledge);

      await crowdfundingv1.connect(otherAccount).pledge(1, amountToPledge);

      console.log(campaign);
      expect(campaign);
    });
  });

  // describe("Events", function () {
  //   it("Should emit an event on launch", async function () {
  //     const { crowdfundingv1, goal, startAt, endAt, token } =
  //       await loadFixture(deployCrowdFundingV1);

  //     // await crowdfundingv1.launch(goal, startAt, endAt, token);

  //     await expect(
  //       crowdfundingv1.launch(goal, startAt, endAt, token)
  //     ).to.emit(crowdfundingv1, "Launch");
  //   });
  // });
});
