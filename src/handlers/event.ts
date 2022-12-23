import { SubstrateEvent } from "@subql/types";
import { getBlock, getExtrinsic } from "../utils/record";

// Ensures block data is populated
export const ensureBlock = async (event: SubstrateEvent) => {
	const blockId = event.block.block.header.number.toString();
	const blockData = await getBlock(blockId);
	blockData.hash = event.block.block.hash.toString();
	blockData.number = BigInt(blockId);
	blockData.timestamp = event.block.timestamp;
	await blockData.save();
	return blockData;
};

// Ensures extrinsic data is populated
export const ensureExtrinsic = async (event: SubstrateEvent) => {
	const blockData = await ensureBlock(event);
	const extrinsicId = event.extrinsic?.extrinsic?.hash?.toString() || '';

	const extrinsicData = await getExtrinsic(extrinsicId);
	extrinsicData.blockId = blockData.id;
	extrinsicData.hash = extrinsicId;
	extrinsicData.method = "";
	extrinsicData.section = "";
	return extrinsicData;
};