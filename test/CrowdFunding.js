const {
  loadFixture,
  mine,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("CrowdFunding", function () {
  async function deployCrowdFundingV1() {
    const goal = 5000000000000; // 0.000005
    const amountToPledge = 5000000000000; // 0.000005

    const [owner, otherAccount] = await ethers.getSigners();

    const TokenERC20 = await ethers.getContractFactory("TokenERC20");
    const tokenERC20 = await TokenERC20.deploy();
    await tokenERC20.deployed();

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
      tokenERC20,
      owner,
      otherAccount,
      goal,
      amountToPledge,
    };
  }
  describe("=== Deployment =================================================", function () {
    it("Should print CrowdFundingV1 contract address", async function () {
      const { crowdfundingv1 } = await loadFixture(deployCrowdFundingV1);
      console.log("CrowdFundingV1 deployed to:", crowdfundingv1.address);
      expect(crowdfundingv1.address);
    });
    it("Should print TokenERC20 contract address", async function () {
      const { tokenERC20 } = await loadFixture(deployCrowdFundingV1);
      console.log("TokenERC20 deployed to:", tokenERC20.address);
      expect(tokenERC20.address);
    });
  });

  describe("=== Campaigns ==================================================", function () {
    it("Should mint 2*5000000000000 ERC20", async function () {
      const {} = await loadFixture(deployCrowdFundingV1);
    });
    it("Should approve CrowdFundingV1 to spend users ERC20", async function () {
      const {} = await loadFixture(deployCrowdFundingV1);
    });
    describe("=== Successful campaign ======================================", function () {
      // function launch
      it("Should create a valid Crowd Funding Campaign", async function () {
        const {
          crowdfundingv1,
          tokenERC20,
          goal,
          owner,
          otherAccount,
          amountToPledge,
        } = await loadFixture(deployCrowdFundingV1);

        const balanceBefore = await tokenERC20.balanceOf(otherAccount.address);
        await tokenERC20
          .connect(owner)
          .mint(otherAccount.address, amountToPledge * 2);
        const balanceAfter = await tokenERC20.balanceOf(otherAccount.address);
        // console.log("User ERC20 balance:", balanceAfter.toString());
        expect(balanceBefore).to.be.lt(balanceAfter);

        const allowanceBefore = await tokenERC20.allowance(
          otherAccount.address,
          crowdfundingv1.address
        );
        await tokenERC20
          .connect(otherAccount)
          .approve(crowdfundingv1.address, amountToPledge * 20);
        const allowanceAfter = await tokenERC20.allowance(
          otherAccount.address,
          crowdfundingv1.address
        );
        // console.log(
        //   "CrowdFundingV1 ERC20 user allowance:",
        //   allowanceAfter.toString()
        // );
        expect(allowanceBefore).to.be.lt(allowanceAfter);

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const timestamp = block.timestamp;

        const startAt = ethers.BigNumber.from(timestamp + 50);
        const endAt = ethers.BigNumber.from(timestamp + 500);

        const launch = await crowdfundingv1
          .connect(owner)
          .launch(goal, tokenERC20.address, startAt, endAt);
        await expect(launch).to.emit(crowdfundingv1, "Launch");
        await launch.wait(1);
        await mine(100);
        const campaign = await crowdfundingv1.campaigns(1);

        // console.log("Campaign:");
        // console.log("- Creator:", campaign.creator);
        // console.log("- Token:", campaign.token);
        // console.log("- Goal:", campaign.goal.toString());
        // console.log("- Pledged:", campaign.pledged.toString());
        // console.log("- StartAt:", campaign.startAt.toString());
        // console.log("- EndAt:", campaign.endAt.toString());
        // console.log("- Claimed:", campaign.claimed);

        expect(campaign.goal).to.be.gt(0);

        crowdfundingv1
          .connect(owner)
          .cancel(1)
          .catch((err) => {
            expect(err); // err = "Campaign has already started"
          });

        const pledgedBeforePledge = (await crowdfundingv1.campaigns(1)).pledged;

        await crowdfundingv1
          .connect(otherAccount)
          .pledge(1, amountToPledge * 2);

        const pledgedAfterPledged = (await crowdfundingv1.campaigns(1)).pledged;
        // console.log("Campaign Pledged amount:", pledgedAfterPledged.toString());
        expect(pledgedBeforePledge).to.be.lt(pledgedAfterPledged);

        const pledgedBeforeUnPledged = (await crowdfundingv1.campaigns(1))
          .pledged;

        await crowdfundingv1.connect(otherAccount).unPledge(1, amountToPledge);

        const pledgedAfterUnPledged = (await crowdfundingv1.campaigns(1))
          .pledged;
        // console.log(
        //   "Campaign Pledged amount:",
        //   pledgedAfterUnPledged.toString()
        // );
        expect(pledgedBeforeUnPledged).to.be.gt(pledgedAfterUnPledged);

        await mine(1000);

        crowdfundingv1
          .connect(otherAccount)
          .refund(1)
          .catch((err) => {
            expect(err); // err = "You cannot Withdraw, Campaign has succeeded"
          });

        await crowdfundingv1.connect(owner).claim(1);
        expect((await crowdfundingv1.campaigns(1)).claimed);
      });
      // function pledge
      it("Should increase campaign pledged amount after otherAccount pledge", async function () {
        const {} = await loadFixture(deployCrowdFundingV1);
      });
      // function cancel
      it("Should not be able to cancel after started", async function () {
        const {} = await loadFixture(deployCrowdFundingV1);
      });
      // function unPledge
      it("Should decrease campaign pledged amount after otherAccount unpledge", async function () {
        const {} = await loadFixture(deployCrowdFundingV1);
      });
      // function refund
      it("Should not be able to refund if campaign success", async function () {
        const {} = await loadFixture(deployCrowdFundingV1);
      });
      // function claim
      it("Goal met, owner should be able claim ERC20 after endAt", async function () {
        const {} = await loadFixture(deployCrowdFundingV1);
      });
    });
  });

  // describe("=== Campaign goal is not met ================================", function () {
  //   it("Should create a valid Crowd Funding Campaign", async function () {
  //     const { crowdfundingv1, tokenERC20, goal, startAt, endAt } =
  //       await loadFixture(deployCrowdFundingV1);

  //     await crowdfundingv1.launch(goal, startAt, endAt, tokenERC20.address);
  //     const campaign = await crowdfundingv1.campaigns(1);

  //     await expect(
  //       crowdfundingv1.launch(goal, startAt, endAt, tokenERC20.address)
  //     ).to.emit(crowdfundingv1, "Launch");

  //     console.log("Campaign:", {
  //       creator: campaign.creator,
  //       token: campaign.token,
  //       goal: campaign.goal.toString(),
  //       pledged: campaign.pledged.toString(),
  //       startAt: campaign.startAt.toString(),
  //       endAt: campaign.endAt.toString(),
  //       claimed: campaign.claimed,
  //     });

  //     expect(campaign);
  //   });
  //   it("Should increase campaign pledged amount after otherAccount pledge", async function () {
  //     const { crowdfundingv1, otherAccount, amountToPledge } =
  //       await loadFixture(deployCrowdFundingV1);
  //     const pledgedBefore = (await crowdfundingv1.campaigns(1)).pledged;

  //     // const contractTimestamp = await crowdfundingv1.getTimestamp();
  //     // console.log("contractTimestamp:", contractTimestamp);

  //     await crowdfundingv1.connect(otherAccount).pledge(1, amountToPledge);

  //     const pledgedAfter = (await crowdfundingv1.campaigns(1)).pledged;
  //     console.log("Campaign Pledged amount:", pledgedAfter.toString());
  //     expect(pledgedBefore).to.be.lt(pledgedAfter);
  //   });
  // });

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

  // async function main() {
  //   // instantly mine 1000 blocks
  //   await mine(1000);
  // }
});
