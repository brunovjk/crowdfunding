<h1>Crowdfunding - Campaign Creator Contract</h1>

1. Campaigns have a maximum possible duration.
2. Funds take the form of an ERC20 token.
3. Crowdfunded projects have a funding goal.
4. When a funding goal is not met, customers are be able to get a refund of their pledged funds.
5. dApps using the contract can observe state changes in transaction logs by listening events.
6. Crowd Funding Contract is upgradeable.

## 💻 Functionality

- Deployment
  - `maxDuration` Campaigns maximum duration
- Launch function

  - `goal` Campaign funding goal
  - `token` Campaign funding ERC20 token
  - `startAt` Campaign start date (Unix timestamp)
  - `endAt` Campaign end date (Unix timestamp)
  - emits `Launch` event

- Cancel function

  - `id` Campaign Id to cancel
  - Require:
    - Signer is the campaign owner
    - Campaign hasn't started yet
  - emits `Cancel` event

- Pledge function

  - `id` Campaign Id to pledge
  - `amount` Amount to pledge
  - Require:
    - Campaign is happening
  - emits `Pledge` event

- UnPledge function

  - `id` Campaign Id to unpledge
  - `amount` Amount to unpledge
  - Require:
    - Campaign is happening
    - Signer has enough tokens Pledged to withraw
  - emits `UnPledge` event

- Claim function

  - `id` Campaign Id to claim
  - Require:
    - Signer is the campaign owner
    - Campaign has ended
    - Successful campaign
  - emits `Claim` event

- Refund function
  - `id` Campaign Id to refund
  - Require:
    - Campaign has ended
    - Campaign did not succed
  - emits `Refund` event

## 💻 Test script

I wrote a series of tests, but please create a request with new tests and changes if you like.

CrowdFunding tests:
✔  Successful Campaign
✔  Failed Campaign 
✔  Upgrade Contract 

## 🚀 Installing CrowdFunding

Before you begin, make sure you have installed `Node.js`

To install CrowdFunding, follow the command:

```
npm install
```

## ☕ Using CrowdFunding

You can now deploy the contract on the network of your choice using `npx hardhat run --network <NETWORK> scripts/deploy.js`, and start using it in your dApp, but first, please run the test scripts I wrote, or feel free to create your own tests.

To monitor the test script, follow these steps:

```
npx hardhat test
```

### Adjustment and improvements

The project is still under development and the next updates will focus on the following tasks:

- [x] Set ERC20Permit - Remove nedd for approve crowdfundingv1 contract to spend tokens

## 📫 Contributing to CrowdFunding

To contribute to CrowdFunding, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to original branch: `git push origin CrowdFunding / <local>`
5. Create the pull request.

Alternatively, see the GitHub documentation at [how to create a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

## 📝 License

This project is under license. See the [LICENSE](LICENSE.md) file for more details.
