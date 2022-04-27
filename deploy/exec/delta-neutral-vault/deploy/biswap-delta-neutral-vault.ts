import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { DeltaNeutralBiswapWorker03__factory, DeltaNeutralVault, WNativeRelayer__factory } from "../../../../typechain";
import { getDeployer } from "../../../../utils/deployer-helper";
import { ConfigFileHelper } from "../../../helper";
import { UpgradeableContractDeployer } from "../../../deployer";
import { DeltaNeutralVaultsEntity } from "../../../interfaces/config";
import { validateAddress } from "../../../../utils/address";

interface IDeltaNeutralVaultInputV2 {
  name: string;
  symbol: string;
  stableVaultSymbol: string;
  assetVaultSymbol: string;
  stableSymbol: string;
  assetSymbol: string;
  stableDeltaWorkerName: string;
  assetDeltaWorkerName: string;
  lpAddress: string;
  deltaNeutralVaultConfig: string;
}

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

  const deployer = await getDeployer();

  const configFileHelper = new ConfigFileHelper();
  let config = configFileHelper.getConfig();

  const POOL_ID = 2;

  const lpPoolAddress = config.YieldSources.Biswap!.pools.find((pool) => pool.pId === POOL_ID)!.address;

  const deltaVaultInputs: IDeltaNeutralVaultInputV2[] = [
    {
      name: "Market Neutral 3x BNB-USDT BS1",
      symbol: "n3x-BNBUSDT-BS1",
      stableVaultSymbol: "ibUSDT",
      assetVaultSymbol: "ibWBNB",
      stableSymbol: "USDT",
      assetSymbol: "WBNB",
      lpAddress: lpPoolAddress,
      // if leave it empty, this will try get from config by using symbol to find config address
      deltaNeutralVaultConfig: "",
      stableDeltaWorkerName: "WBNB-USDT 3x BS1 DeltaNeutralBiswapWorker",
      assetDeltaWorkerName: "USDT-WBNB 3x BS1 DeltaNeutralBiswapWorker",
    },
  ];

  const alpacaTokenAddress = config.Tokens.ALPACA;
  const wNativeRelayerAddr = config.SharedConfig.WNativeRelayer;
  for (let i = 0; i < deltaVaultInputs.length; i++) {
    const deltaVaultInput = deltaVaultInputs[i];
    const stableVault = config.Vaults.find((v) => v.symbol === deltaVaultInput.stableVaultSymbol);
    const assetVault = config.Vaults.find((v) => v.symbol === deltaVaultInput.assetVaultSymbol);
    if (stableVault === undefined) {
      throw `error: unable to find vault from ${deltaVaultInput.stableVaultSymbol}`;
    }
    if (assetVault === undefined) {
      throw `error: unable to find vault from ${deltaVaultInput.assetVaultSymbol}`;
    }

    if (deltaVaultInput.deltaNeutralVaultConfig === "") {
      const deltaVault = config.DeltaNeutralVaults.find((dv) => dv.symbol === deltaVaultInput.symbol);
      if (!deltaVault || !validateAddress(deltaVault.config)) throw Error("Couldn't find delta vault config");
      deltaVaultInput.deltaNeutralVaultConfig = deltaVault.config;
    }

    // get worker addresses from config file
    const stableWorkerAddress = stableVault.workers.find(
      (worker) => worker.name === deltaVaultInput.stableDeltaWorkerName
    )?.address;
    if (!stableWorkerAddress || !validateAddress(stableWorkerAddress)) {
      throw `error: unable to find worker ${deltaVaultInput.stableDeltaWorkerName} from ${deltaVaultInput.stableVaultSymbol} workers`;
    }
    const assetWorkerAddress = assetVault.workers.find(
      (worker) => worker.name === deltaVaultInput.assetDeltaWorkerName
    )?.address;
    if (!assetWorkerAddress || !validateAddress(assetWorkerAddress)) {
      throw `error: unable to find worker ${deltaVaultInput.assetDeltaWorkerName} from ${deltaVaultInput.assetVaultSymbol} workers`;
    }

    const deltaVaultDeployer = new UpgradeableContractDeployer<DeltaNeutralVault>(
      deployer,
      "DeltaNeutralVault",
      deltaVaultInput.name
    );

    const { contract: deltaNeutralVault, deployedBlock } = await deltaVaultDeployer.deploy([
      deltaVaultInput.name,
      deltaVaultInput.symbol,
      stableVault.address,
      assetVault.address,
      stableWorkerAddress,
      assetWorkerAddress,
      deltaVaultInput.lpAddress,
      alpacaTokenAddress,
      // TODO: check
      config.Oracle.DeltaNeutralOracle!,
      deltaVaultInput.deltaNeutralVaultConfig,
    ]);

    if (deltaVaultInput.assetVaultSymbol === "ibWBNB" || deltaVaultInput.assetVaultSymbol === "ibFTM") {
      console.log(`>> Set Caller ok for deltaNeutralVault if have native asset`);
      const wNativeRelayer = WNativeRelayer__factory.connect(wNativeRelayerAddr, deployer);
      await (await wNativeRelayer.setCallerOk([deltaNeutralVault.address], true)).wait(3);
      console.log("✅ Done");
    }

    // set whitelisted caller on workers
    let nonce = await deployer.getTransactionCount();

    const stableWorker = DeltaNeutralBiswapWorker03__factory.connect(stableWorkerAddress, deployer);
    await stableWorker.setWhitelistedCallers([deltaNeutralVault.address], true, { nonce: nonce++ });

    const assetWorker = DeltaNeutralBiswapWorker03__factory.connect(assetWorkerAddress, deployer);
    await assetWorker.setWhitelistedCallers([deltaNeutralVault.address], true, { nonce: nonce++ });

    const deltaNuetralVaultEntity: DeltaNeutralVaultsEntity = {
      name: deltaVaultInput.name,
      symbol: deltaVaultInput.symbol,
      address: deltaNeutralVault.address,
      deployedBlock: deployedBlock,
      config: deltaVaultInput.deltaNeutralVaultConfig,
      assetToken: assetVault.baseToken,
      stableToken: stableVault.baseToken,
      assetVault: assetVault.address,
      stableVault: stableVault.address,
      assetDeltaWorker: assetWorkerAddress,
      stableDeltaWorker: stableWorkerAddress,
      oracle: config.Oracle.DeltaNeutralOracle!,
      gateway: ethers.constants.AddressZero,
      assetVaultPosId: "-1",
      stableVaultPosId: "-1",
    };

    config = configFileHelper.addOrSetDeltaNeutralVaults(deltaVaultInput.symbol, deltaNuetralVaultEntity);
  }
};

export default func;
func.tags = ["BiswapDeltaNeutralVault"];