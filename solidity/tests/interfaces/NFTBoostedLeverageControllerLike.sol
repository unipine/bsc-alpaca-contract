// SPDX-License-Identifier: GPL-3.0
// !! THIS FILE WAS AUTOGENERATED BY abi-to-sol v0.5.2. SEE SOURCE BELOW. !!
pragma solidity ^0.8.4;

interface NFTBoostedLeverageControllerLike {
    error NFTBoostedLeverageController_BadParamsLength();
    error NFTBoostedLeverageController_NoPool();
    error NFTBoostedLeverageController_PoolAlreadyListed();
    event LogSetBoosted(
        address[] _workers,
        uint256[] _workFactors,
        uint256[] _killFactors
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    function boostedKillFactors(bytes32, address)
        external
        view
        returns (uint256);

    function boostedWorkFactors(bytes32, address)
        external
        view
        returns (uint256);

    function getBoostedKillFactor(address _owner, address _worker)
        external
        view
        returns (uint256);

    function getBoostedWorkFactor(address _owner, address _worker)
        external
        view
        returns (uint256);

    function initialize(address _nftStaking) external;

    function nftStaking() external view returns (address);

    function owner() external view returns (address);

    function renounceOwnership() external;

    function setBoosted(
        bytes32[] memory _poolIds,
        address[] memory _workers,
        uint256[] memory _workFactors,
        uint256[] memory _killFactors
    ) external;

    function transferOwnership(address newOwner) external;
}
