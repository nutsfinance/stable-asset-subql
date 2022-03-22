import {
	Account, Block, Extrinsic, Mint
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
		return newRecord;
	} else {
		return record;
	}
};