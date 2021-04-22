import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';
import { PancakeswapV2StrategyAddTwoSidesOptimalMigrate__factory } from '../typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    /*
  ░██╗░░░░░░░██╗░█████╗░██████╗░███╗░░██╗██╗███╗░░██╗░██████╗░
  ░██║░░██╗░░██║██╔══██╗██╔══██╗████╗░██║██║████╗░██║██╔════╝░
  ░╚██╗████╗██╔╝███████║██████╔╝██╔██╗██║██║██╔██╗██║██║░░██╗░
  ░░████╔═████║░██╔══██║██╔══██╗██║╚████║██║██║╚████║██║░░╚██╗
  ░░╚██╔╝░╚██╔╝░██║░░██║██║░░██║██║░╚███║██║██║░╚███║╚██████╔╝
  ░░░╚═╝░░░╚═╝░░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═╝╚═╝░░╚══╝░╚═════╝░
  Check all variables below before execute the deployment script
  */

  const ROUTER_V2 = '0x367633909278A3C91f4cB130D8e56382F00D1071';








  /**
   * StrategyAddTwoSidesOptimalMigrate V2
   */
  console.log(">> Deploying an upgradable StrategyAddTwoSidesOptimalMigrate V2 contract");
  const PancakeswapV2StrategyAddTwoSidesOptimalMigrate = (await ethers.getContractFactory(
    "PancakeswapV2StrategyAddTwoSidesOptimalMigrate",
    (await ethers.getSigners())[0],
  )) as PancakeswapV2StrategyAddTwoSidesOptimalMigrate__factory;
  const strategyAddTwoSidesOptimalMigrateV2 = await upgrades.deployProxy(PancakeswapV2StrategyAddTwoSidesOptimalMigrate, [ROUTER_V2]);
  await strategyAddTwoSidesOptimalMigrateV2.deployed()
  console.log(`>> Deployed at ${strategyAddTwoSidesOptimalMigrateV2.address}`);
  console.log("✅ Done")
};

export default func;
func.tags = ['TwoSideOptimalMigrateV2'];