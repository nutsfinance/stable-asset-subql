import {
	Account, Block, Extrinsic, Mint, Swap, ProportionRedeem, SingleRedeem, MultiRedeem, HourlyData, DailyData
} from "../types";

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

export const getHourlyData = async (id: string) => {
	const record = await HourlyData.get(id);

	if (!record) {
		const newRecord = new HourlyData(id);
        newRecord.mintVolume = BigInt(0);
        newRecord.swapVolume = BigInt(0);
        newRecord.redeemVolume = BigInt(0);
		return newRecord;
	} else {
		return record;
	}
};

export const getDailyData = async (id: string) => {
	const record = await DailyData.get(id);

	if (!record) {
		const newRecord = new DailyData(id);
        newRecord.mintVolume = BigInt(0);
        newRecord.swapVolume = BigInt(0);
        newRecord.redeemVolume = BigInt(0);
		return newRecord;
	} else {
		return record;
	}
};