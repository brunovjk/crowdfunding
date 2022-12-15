// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IERC20 {
    function transfer(address, uint256) external returns (bool);

    function transferFrom(address, address, uint256) external returns (bool);
}

/**
 * @title CrowdFund Smart Contract
 * @author Bruno Rocha
 */
/// @custom:security-contact brunovjk@gmail.com
contract CrowdFundingV2 is Initializable {
    struct Campaign {
        address creator;
        address token;
        uint256 goal;
        uint256 pledged;
        uint256 startAt;
        uint256 endAt;
        bool claimed;
    }

    uint256 public count;
    uint256 public maxDuration;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public pledgedAmount;

    event Launch(
        uint256 id,
        address indexed creator,
        uint256 goal,
        uint256 startAt,
        uint256 endAt
    );
    event Cancel(uint256 id);
    event Pledge(uint256 indexed id, address indexed caller, uint256 amount);
    event Unpledge(uint256 indexed id, address indexed caller, uint256 amount);
    event Claim(uint256 id);
    event Refund(uint256 id, address indexed caller, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _maxDuration) public initializer {
        maxDuration = _maxDuration;
    }

    function setMaxDuration(uint256 _newMaxDuration) public {
        maxDuration = _newMaxDuration;
    }

    function launch(
        uint256 _goal,
        address _token,
        uint256 _startAt,
        uint256 _endAt
    ) external {
        require(
            _startAt >= block.timestamp,
            "Start time is less than current Block Timestamp"
        );
        require(_endAt > _startAt, "End time is less than Start time");
        require(
            _endAt <= block.timestamp + maxDuration,
            "End time exceeds the maximum Duration"
        );

        count += 1;
        campaigns[count] = Campaign({
            creator: msg.sender,
            goal: _goal,
            token: _token,
            pledged: 0,
            startAt: _startAt,
            endAt: _endAt,
            claimed: false
        });

        emit Launch(count, msg.sender, _goal, _startAt, _endAt);
    }

    function cancel(uint256 _id) external {
        Campaign memory campaign = campaigns[_id];
        require(
            campaign.creator == msg.sender,
            "You did not create this Campaign"
        );
        require(
            block.timestamp < campaign.startAt,
            "Campaign has already started"
        );

        delete campaigns[_id];
        emit Cancel(_id);
    }

    function pledge(uint256 _id, uint256 _amount) external {
        Campaign storage campaign = campaigns[_id];
        require(
            block.timestamp >= campaign.startAt,
            "Campaign has not Started yet"
        );
        require(
            block.timestamp <= campaign.endAt,
            "Campaign has already ended"
        );
        campaign.pledged += _amount;
        pledgedAmount[_id][msg.sender] += _amount;
        IERC20(campaign.token).transferFrom(msg.sender, address(this), _amount);

        emit Pledge(_id, msg.sender, _amount);
    }

    function unPledge(uint256 _id, uint256 _amount) external {
        Campaign storage campaign = campaigns[_id];
        require(
            block.timestamp >= campaign.startAt,
            "Campaign has not Started yet"
        );
        require(
            block.timestamp <= campaign.endAt,
            "Campaign has already ended"
        );
        require(
            pledgedAmount[_id][msg.sender] >= _amount,
            "You do not have enough tokens Pledged to withraw"
        );

        campaign.pledged -= _amount;
        pledgedAmount[_id][msg.sender] -= _amount;
        IERC20(campaign.token).transfer(msg.sender, _amount);

        emit Unpledge(_id, msg.sender, _amount);
    }

    function claim(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        require(
            campaign.creator == msg.sender,
            "You did not create this Campaign"
        );
        require(block.timestamp > campaign.endAt, "Campaign has not ended");
        require(campaign.pledged >= campaign.goal, "Campaign did not succed");
        require(!campaign.claimed, "claimed");

        campaign.claimed = true;
        IERC20(campaign.token).transfer(campaign.creator, campaign.pledged);

        emit Claim(_id);
    }

    function refund(uint256 _id) external {
        Campaign memory campaign = campaigns[_id];
        require(block.timestamp > campaign.endAt, "not ended");
        require(
            campaign.pledged < campaign.goal,
            "You cannot Withdraw, Campaign has succeeded"
        );

        uint256 bal = pledgedAmount[_id][msg.sender];
        pledgedAmount[_id][msg.sender] = 0;
        IERC20(campaign.token).transfer(msg.sender, bal);

        emit Refund(_id, msg.sender, bal);
    }
}
