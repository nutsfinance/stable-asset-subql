import { SubstrateEvent } from "@subql/types";
import { AccountId, Balance } from "@acala-network/types/interfaces";
import { ensureBlock, ensureExtrinsic } from ".";
import { getAccount, getSwap, getHourlyData, getDailyData, getStartOfHour, getStartOfDay } from "../utils";
import { FeeCollection, YieldCollection, Operation } from "../types";

export const swap = async (event: SubstrateEvent) => {
    logger.info('Swap Events: ' + JSON.stringify(event));
    // [swapper, pool id, a, input asset, output asset, input amount, min_output_amount, balances, total supply, output amount]
    const [swapper, poolId, a, intputAsset, outputAsset, inputAmount, minOutputAmount, balances, totalSupply, outputAmount] = event.event.data as unknown as [AccountId, number, number, string, string, Balance, Balance, Balance[], Balance, Balance];
    const blockData = await ensureBlock(event);
    logger.info('swapper: ' + swapper.toString());
    logger.info('poolId: ' +  poolId);
    logger.info('a:' + a);
    logger.info('inputAsset:' + intputAsset)
    logger.info('outputAsset: ' + outputAsset)
    logger.info('inputAmount: ' + inputAmount)
    logger.info('min: ' +  minOutputAmount)
    logger.info('balances: ' + balances)
    logger.info('totalSupply: ' + totalSupply)
    logger.info('outputAmount:' +  outputAmount)
    const hourTime = getStartOfHour(blockData.timestamp);
	const dailyTime = getStartOfDay(blockData.timestamp);

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
        const feeCollection = new FeeCollection(swapId);
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

        const yieldCollection = new YieldCollection(swapId);
        yieldCollection.addressId = swapper.toString();
        yieldCollection.poolId = poolId;
        yieldCollection.operation = Operation.SWAP;
        yieldCollection.amount = BigInt(yieldAmount.toString());
        yieldCollection.blockId = blockData.id;
        yieldCollection.timestamp = blockData.timestamp;
        yieldCollection.extrinsicId = swap.extrinsicId;

        await yieldCollection.save();
    }

    // Update hourly data
    const hourlyData = await getHourlyData(poolId, hourTime);
    hourlyData.swapTx += 1;
    hourlyData.totalTx += 1;
    hourlyData.swapVolume = hourlyData.swapVolume + swap.inputAmount;
    hourlyData.totalVolume = hourlyData.totalVolume + swap.inputAmount;
    hourlyData.feeVolume = hourlyData.feeVolume + swap.feeAmount;
    hourlyData.yieldVolume = hourlyData.yieldVolume + swap.yieldAmount;
    await hourlyData.save();

    // Update daily data
    const dailyData = await getDailyData(poolId, dailyTime);
    dailyData.swapTx += 1;
    dailyData.totalTx += 1;
    dailyData.redeemVolume = dailyData.redeemVolume + swap.inputAmount;
    dailyData.totalVolume = dailyData.totalVolume + swap.inputAmount;
    dailyData.feeVolume = dailyData.feeVolume + swap.feeAmount;
    dailyData.yieldVolume = dailyData.yieldVolume + swap.yieldAmount;
    await dailyData.save();

	await swap.save();
}