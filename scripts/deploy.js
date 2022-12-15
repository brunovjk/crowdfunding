// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
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

  console.log(`CrowdfundingV1 deployed to ${crowdfundingv1.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
