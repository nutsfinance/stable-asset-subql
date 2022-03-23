import { SubstrateEvent } from "@subql/types";
import { AccountId, Balance } from "@acala-network/types/interfaces";
import { ensureBlock, ensureExtrinsic } from ".";
import { getAccount, getSwap } from "../utils";
import { FeeCollection, YieldCollection, Operation } from "../types";

export const swap = async (event: SubstrateEvent) => {
    // [swapper, pool id, a, input asset, output asset, input amount, min_output_amount, balances, total supply, output amount]
    const [swapper, poolId, a, intputAsset, outputAsset, inputAmount, minOutputAmount, balances, totalSupply, outputAmount] = event.event.data as unknown as [AccountId, number, number, number, number, Balance, Balance, Balance[], Balance, Balance];
    const blockData = await ensureBlock(event);

    const swapId = `${blockData.hash}-${event.idx.toString()}`;
    logger.info('Swap ID: ' + swapId)
    const swap = await getSwap(swapId);

    swap.addressId = swapper.toString();
    swap.poolId = poolId;
    swap.a = a;
    swap.inputAsset = intputAsset;
    swap.outputAsset = outputAsset;
    swap.inputAmount = BigInt(inputAmount.toString());
    swap.minOutputAmount = BigInt(minOutputAmount.toString());
    swap.balances = balances.map(amount => amount.toString()).join();
    swap.totalSupply = BigInt(totalSupply.toString());
    swap.outputAmount = BigInt(outputAmount.toString());

    swap.blockId = blockData.id
    swap.timestamp = blockData.timestamp;

    // Update extrinsic data
    if (event.extrinsic) {
		const extrinsicData = await ensureExtrinsic(event);
		swap.extrinsicId = extrinsicData.id;
		await getAccount(event.extrinsic.extrinsic.signer.toString());

		extrinsicData.section = event.event.section;
		extrinsicData.method = event.event.method;
		extrinsicData.addressId = event.extrinsic.extrinsic.signer.toString();

		await extrinsicData.save();
	}

    // Update fee data
    const feeEvent = event.extrinsic.events.find(event => event.event.method === 'FeeCollected');
    if (feeEvent) {
        const [,,,,,,, feeAmount] = feeEvent.event.data as unknown as [number, number, Balance[], Balance[], Balance, Balance, AccountId, Balance];
        swap.feeAmount += BigInt(feeAmount.toString());
    }
    if (swap.feeAmount > 0) {
        const feeId = `${swapId}-fee`;
        const feeCollection = new FeeCollection(feeId);
        feeCollection.addressId = swapper.toString();
        feeCollection.poolId = poolId;
        feeCollection.operation = Operation.SWAP;
        feeCollection.amount = swap.feeAmount;
        feeCollection.blockId = blockData.id;
        feeCollection.timestamp = blockData.timestamp;
        feeCollection.extrinsicId = swap.extrinsicId;

        await feeCollection.save();
    }

    // Update yield data
    const yieldEvent = event.extrinsic.events.find(event => event.event.method === 'YieldCollected');
    if (yieldEvent) {
        const [,,,,, yieldAmount] = yieldEvent.event.data as unknown as [number, number, Balance, Balance, AccountId, Balance];
        swap.yieldAmount = BigInt(yieldAmount.toString());

        const yieldId = `${swapId}-yield`;
        const yieldCollection = new YieldCollection(yieldId);
        yieldCollection.addressId = swapper.toString();
        yieldCollection.poolId = poolId;
        yieldCollection.operation = Operation.SWAP;
        yieldCollection.amount = BigInt(yieldAmount.toString());
        yieldCollection.blockId = blockData.id;
        yieldCollection.timestamp = blockData.timestamp;
        yieldCollection.extrinsicId = swap.extrinsicId;

        await yieldCollection.save();
    }

	await swap.save();
}