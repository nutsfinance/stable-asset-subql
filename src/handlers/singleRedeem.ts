import { SubstrateEvent } from "@subql/types";
import { AccountId, Balance } from "@acala-network/types/interfaces";
import { ensureBlock, ensureExtrinsic } from ".";
import { getAccount, getSingleRedeem, getHourlyData, getDailyData, getStartOfHour, getStartOfDay, getNumber, getPoolDecimals } from "../utils";
import { FeeCollection, YieldCollection, Operation } from "../types";

export const singleRedeem = async (event: SubstrateEvent) => {
    logger.info('Single Redem Events: ' + JSON.stringify(event));
    // [redeemer, pool id, a, input amount, output_asset, min_output_amount, balances, total supply, fee amount, output amount]
    const [redeemer, poolId, a, inputAmount, outputAsset, minOutputAmount, balances, totalSupply, feeAmount, outputAmount] = event.event.data as unknown as [AccountId, number, number, Balance, string, Balance, Balance[], Balance, Balance, Balance];
    const blockData = await ensureBlock(event);
    // logger.info('redeemer: ' + redeemer.toString());
    // logger.info('poolId: ' +  poolId);
    // logger.info('a:' + a);
    // logger.info('inputAmount: ' + inputAmount)
    // logger.info('outputAsset: ' + outputAsset)
    // logger.info('min: ' +  minOutputAmount)
    // logger.info('balances: ' + balances)
    // logger.info('totalSupply: ' + totalSupply)
    // logger.info('feeAmount: ' + feeAmount)
    // logger.info('outputAmount:' +  outputAmount)
    const hourTime = getStartOfHour(blockData.timestamp);
	const dailyTime = getStartOfDay(blockData.timestamp);

    const singleRedeemId = `${blockData.hash}-${event.idx.toString()}`;
    logger.info('Redeem ID: ' + singleRedeemId)
    const singleRedeem = await getSingleRedeem(singleRedeemId);

    singleRedeem.addressId = redeemer.toString();
    singleRedeem.poolId = poolId;
    singleRedeem.a = a;
    singleRedeem.inputAmount = BigInt(inputAmount.toString());
    singleRedeem.outputAsset = outputAsset;
    singleRedeem.minOutputAmount = BigInt(minOutputAmount.toString());
    singleRedeem.balances = balances.map(amount => amount.toString()).join();
    singleRedeem.totalSupply = BigInt(totalSupply.toString());
    singleRedeem.feeAmount = BigInt(feeAmount.toString());
    singleRedeem.outputAmount = BigInt(outputAmount.toString());

    singleRedeem.blockId = blockData.id
    singleRedeem.timestamp = blockData.timestamp;

    // Update extrinsic data
    if (event.extrinsic) {
		const extrinsicData = await ensureExtrinsic(event);
		singleRedeem.extrinsicId = extrinsicData.id;
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
        singleRedeem.feeAmount += BigInt(feeAmount.toString());
    }
    if (singleRedeem.feeAmount > 0) {
        const feeCollection = new FeeCollection(singleRedeemId);
        feeCollection.addressId = redeemer.toString();
        feeCollection.poolId = poolId;
        feeCollection.operation = Operation.PROPORTION_REDEEM;
        feeCollection.amount = singleRedeem.feeAmount;
        feeCollection.blockId = blockData.id;
        feeCollection.timestamp = blockData.timestamp;
        feeCollection.extrinsicId = singleRedeem.extrinsicId;

        await feeCollection.save();
    }

    // Update yield data
    const yieldEvent = event.extrinsic.events.find(event => event.event.method === 'YieldCollected');
    if (yieldEvent) {
        const [,,,,, yieldAmount] = yieldEvent.event.data as unknown as [number, number, Balance, Balance, AccountId, Balance];
        singleRedeem.yieldAmount = BigInt(yieldAmount.toString());

        const yieldCollection = new YieldCollection(singleRedeemId);
        yieldCollection.addressId = redeemer.toString();
        yieldCollection.poolId = poolId;
        yieldCollection.operation = Operation.PROPORTION_REDEEM;
        yieldCollection.amount = BigInt(yieldAmount.toString());
        yieldCollection.blockId = blockData.id;
        yieldCollection.timestamp = blockData.timestamp;
        yieldCollection.extrinsicId = singleRedeem.extrinsicId;

        await yieldCollection.save();
    }

    const decimals = await getPoolDecimals(poolId);
    // Update hourly data
    const hourlyData = await getHourlyData(poolId, hourTime);
    hourlyData.redeemTx += 1;
    hourlyData.totalTx += 1;
    hourlyData.redeemVolume += getNumber(singleRedeem.inputAmount, decimals);
    hourlyData.totalVolume += getNumber(singleRedeem.inputAmount, decimals);
    hourlyData.feeVolume += getNumber(singleRedeem.feeAmount, decimals);
    hourlyData.yieldVolume += getNumber(singleRedeem.yieldAmount, decimals);
    await hourlyData.save();

    // Update daily data
    const dailyData = await getDailyData(poolId, dailyTime);
    dailyData.redeemTx += 1;
    dailyData.totalTx += 1;
    dailyData.redeemVolume += getNumber(singleRedeem.inputAmount, decimals);
    dailyData.totalVolume += getNumber(singleRedeem.inputAmount, decimals);
    dailyData.feeVolume += getNumber(singleRedeem.feeAmount, decimals);
    dailyData.yieldVolume += getNumber(singleRedeem.yieldAmount, decimals);
    await dailyData.save();

	await singleRedeem.save();
}