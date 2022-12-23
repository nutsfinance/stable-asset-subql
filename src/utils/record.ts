import { getStakingCurrency, getTokenDecimals, getLiquidCurrency } from '@acala-network/subql-utils';
import { FixedPointNumber } from '@acala-network/sdk-core';
import {
	Account, Block, Extrinsic, Mint, Swap, ProportionRedeem, SingleRedeem, MultiRedeem, HourlyData, DailyData
} from "../types";
import { getPoolInfo } from "./pool";

export const getAccount = async (address: string) => {
	const _account = await Account.get(address);
	if (!_account) {
		const newAccount = new Account(address);
		newAccount.address = address;
		newAccount.txCount = BigInt(0);
		await newAccount.save();
		return newAccount;
	} else {
		return _account;
	}
};

export const getBlock = async (id: string) => {
	const _block = await Block.get(id);
	if (!_block) {
		const newBlock = new Block(id);
		newBlock.hash = "";
		newBlock.number = BigInt(0);
		newBlock.timestamp = new Date();
		newBlock.liquidExchangeRate = await getLiquidExchangeRate();

		await newBlock.save();
		return newBlock;
	} else {
		return _block;
	}
};

export const getExtrinsic = async (id: string) => {
	const record = await Extrinsic.get(id);

	if (!record) {
		const newRecord = new Extrinsic(id);
		newRecord.hash = "";
		newRecord.blockId = "";
		newRecord.method = "";
		newRecord.section = "";
		return newRecord;
	} else {
		return record;
	}
};

export const getMint = async (id: string) => {
	const record = await Mint.get(id);

	if (!record) {
		const newRecord = new Mint(id);
        newRecord.feeAmount = BigInt(0);
        newRecord.yieldAmount = BigInt(0);
		return newRecord;
	} else {
		return record;
	}
};

export const getSwap = async (id: string) => {
	const record = await Swap.get(id);

	if (!record) {
		const newRecord = new Swap(id);
        newRecord.feeAmount = BigInt(0);
        newRecord.yieldAmount = BigInt(0);
		return newRecord;
	} else {
		return record;
	}
};

export const getProportionRedeem = async (id: string) => {
	const record = await ProportionRedeem.get(id);

	if (!record) {
		const newRecord = new ProportionRedeem(id);
        newRecord.feeAmount = BigInt(0);
        newRecord.yieldAmount = BigInt(0);
		return newRecord;
	} else {
		return record;
	}
};

export const getSingleRedeem = async (id: string) => {
	const record = await SingleRedeem.get(id);

	if (!record) {
		const newRecord = new SingleRedeem(id);
        newRecord.feeAmount = BigInt(0);
        newRecord.yieldAmount = BigInt(0);
		return newRecord;
	} else {
		return record;
	}
};

export const getMultiRedeem = async (id: string) => {
	const record = await MultiRedeem.get(id);

	if (!record) {
		const newRecord = new MultiRedeem(id);
        newRecord.feeAmount = BigInt(0);
        newRecord.yieldAmount = BigInt(0);
		return newRecord;
	} else {
		return record;
	}
};

export const getHourlyData = async (poolId: number, hourTime: Date) => {
	const id = `${poolId}-${hourTime.getTime()}`;
	const record = await HourlyData.get(id);

	if (!record) {
		const newRecord = new HourlyData(id);
		newRecord.poolId = poolId;
		newRecord.timestamp = hourTime;
        newRecord.mintTx = 0;
        newRecord.swapTx = 0;
        newRecord.redeemTx = 0;
        newRecord.totalTx = 0;
        newRecord.mintVolume = 0;
        newRecord.swapVolume = 0;
        newRecord.redeemVolume = 0;
        newRecord.totalVolume = 0;
        newRecord.feeVolume = 0;
        newRecord.yieldVolume = 0;

		// New hourly record. Read point in time data
		const poolInfo = await getPoolInfo(poolId);
		newRecord.totalSupply = poolInfo.totalSupply;
		newRecord.balances = poolInfo.balances;
		newRecord.feeBalance = poolInfo.feeBalance;
		newRecord.yieldBalance = poolInfo.yieldBalance;

		return newRecord;
	} else {
		logger.info(JSON.stringify(record));
		return record;
	}
};

export const getDailyData = async (poolId: number, dailyTime: Date) => {
	const id = `${poolId}-${dailyTime.getTime()}`;
	// logger.info('Daily data ID: ' + id)
	const record = await DailyData.get(id);

	if (!record) {
		const newRecord = new DailyData(id);
		newRecord.poolId = poolId;
		newRecord.timestamp = dailyTime;
        newRecord.mintTx = 0;
        newRecord.swapTx = 0;
        newRecord.redeemTx = 0;
        newRecord.totalTx = 0;
        newRecord.mintVolume = 0;
        newRecord.swapVolume = 0;
        newRecord.redeemVolume = 0;
        newRecord.totalVolume = 0;
        newRecord.feeVolume = 0;
        newRecord.yieldVolume = 0;
		newRecord.feeApr = 0;
        newRecord.yieldApr = 0;

		// New daily record. Read point in time data
		const poolInfo = await getPoolInfo(poolId);
		newRecord.totalSupply = poolInfo.totalSupply;
		newRecord.balances = poolInfo.balances;
		newRecord.feeBalance = poolInfo.feeBalance;
		newRecord.yieldBalance = poolInfo.yieldBalance;

		return newRecord;
	} else {
		return record;
	}
};

export const getTotalStaking = async (decimals: number) => {
	const toBond = await api.query.homa.toBondPool();
	const stakingLedgers = await api.query.homa.stakingLedgers.entries();
	let totalInSubAccount = FixedPointNumber.ZERO;
  
	stakingLedgers.map(item => {
	  const ledge = (item[1] as any).unwrapOrDefault();
	  totalInSubAccount = totalInSubAccount.add(FixedPointNumber.fromInner(ledge.bonded.unwrap().toString(), decimals));
	})
  
	const total = FixedPointNumber.fromInner(toBond.toString(), decimals).add(totalInSubAccount);
  
	return total;
  }

export const getLiquidExchangeRate = async () => {
	const stakingToken = getStakingCurrency(api as any);
	const liquidToken = getLiquidCurrency(api as any);
	const stakingTokenDecimals = await getTokenDecimals(api  as any, stakingToken);
	const liquidTokenDecimals = await getTokenDecimals(api as any, liquidToken);
	const liquidTokenIssuance = await api.query.tokens.totalIssuance(liquidToken);

	const totalStaking = await getTotalStaking(stakingTokenDecimals);
	const totalLiquid = FixedPointNumber.fromInner(liquidTokenIssuance.toString(), liquidTokenDecimals);
	const totalVoidliquid = await api.query.homa.totalVoidLiquid();
	const totalVoidliquidFN = FixedPointNumber.fromInner(totalVoidliquid.toString(), liquidTokenDecimals);
	const exchangeRate = totalStaking.div(totalLiquid.add(totalVoidliquidFN));
	exchangeRate.setPrecision(18);

	return BigInt(exchangeRate.toChainData());
}