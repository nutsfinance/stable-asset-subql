import {
	Account, Block, Extrinsic, Mint, Swap, ProportionRedeem, SingleRedeem, MultiRedeem, HourlyData, DailyData
} from "../types";
import { getNumber, getPoolDecimals } from ".";
import { Option } from '@polkadot/types/codec';
import { Codec } from '@polkadot/types/types';

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
		const poolInfo = (await api.query.stableAsset.pools(poolId) as Option<Codec>).unwrap();
		const decimals = getPoolDecimals(poolId);
		logger.info('1111111111111111');
		logger.info(JSON.stringify(poolInfo));
		logger.info('222222222222222222');
		logger.info(JSON.stringify((poolInfo as any).totalSupply));
		logger.info('333333333333333333');
		logger.info(JSON.stringify((poolInfo as any).balances));
		newRecord.totalSupply = getNumber((poolInfo as any).totalSupply, decimals);
		newRecord.balances = (poolInfo as any).balances.map(balance => getNumber(balance, decimals));

		return newRecord;
	} else {
		logger.info(JSON.stringify(record));
		return record;
	}
};

export const getDailyData = async (poolId: number, dailyTime: Date) => {
	const id = `${poolId}-${dailyTime.getTime()}`;
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
		return newRecord;
	} else {
		return record;
	}
};