require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
      },
    ],
  },
  networks: {
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    //   hardhat: {
    //     forking: {
    //       url: process.env.MUMBAI_RPC_URL,
    //       blockNumber: 14390000,
    //     },
    //   },
    //   mumbai: {
    //     url: process.env.MUMBAI_RPC_URL,
    //     accounts: [process.env.PRIVATE_KEY],
    //   },
  },
};
