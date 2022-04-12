import { SubstrateEvent } from "@subql/types";
import { AccountId, Balance } from "@acala-network/types/interfaces";
import { ensureBlock, ensureExtrinsic } from ".";
import { getAccount, getMultiRedeem, getHourlyData, getDailyData, getStartOfHour, getStartOfDay } from "../utils";
import { FeeCollection, YieldCollection, Operation } from "../types";

export const multiRedeem = async (event: SubstrateEvent) => {
    logger.info('Multi Redeem Events: ' + JSON.stringify(event));
    // [redeemer, pool id, a, output amounts, max_input_amount, balances, total supply, fee amount, input amount]
    const [redeemer, poolId, a, outputAmounts, maxInputAmount, balances, totalSupply, feeAmount, inputAmount] = event.event.data as unknown as [AccountId, number, number, Balance[], Balance, Balance[], Balance, Balance, Balance];
    const blockData = await ensureBlock(event);
    logger.info('redeemer: ' + redeemer.toString());
    logger.info('poolId: ' +  poolId);
    logger.info('a:' + a);
    logger.info('outputAmounts: ' + outputAmounts)
    logger.info('max: ' +  maxInputAmount)
    logger.info('balances: ' + balances)
    logger.info('totalSupply: ' + totalSupply)
    logger.info('feeAmount: ' + feeAmount)
    logger.info('inputAmount:' +  inputAmount)
    const hourTime = getStartOfHour(blockData.timestamp);
	const dailyTime = getStartOfDay(blockData.timestamp);

    const multiRedeemId = `${blockData.hash}-${event.idx.toString()}`;
    logger.info('Redeem ID: ' + multiRedeemId)
    const multiRedeem = await getMultiRedeem(multiRedeemId);

    multiRedeem.addressId = redeemer.toString();
    multiRedeem.poolId = poolId;
    multiRedeem.a = a;
    multiRedeem.outputAmounts = outputAmounts.map(amount => amount.toString()).join();
    multiRedeem.maxInputAmount = BigInt(maxInputAmount.toString());
    multiRedeem.balances = balances.map(amount => amount.toString()).join();
    multiRedeem.totalSupply = BigInt(totalSupply.toString());
    multiRedeem.feeAmount = BigInt(feeAmount.toString());
    multiRedeem.inputAmount = BigInt(inputAmount.toString());

    multiRedeem.blockId = blockData.id
    multiRedeem.timestamp = blockData.timestamp;

    // Update extrinsic data
    if (event.extrinsic) {
		const extrinsicData = await ensureExtrinsic(event);
		multiRedeem.extrinsicId = extrinsicData.id;
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
        multiRedeem.feeAmount += BigInt(feeAmount.toString());
    }
    if (multiRedeem.feeAmount > 0) {
        const feeCollection = new FeeCollection(multiRedeemId);
        feeCollection.addressId = redeemer.toString();
        feeCollection.poolId = poolId;
        feeCollection.operation = Operation.PROPORTION_REDEEM;
        feeCollection.amount = multiRedeem.feeAmount;
        feeCollection.blockId = blockData.id;
        feeCollection.timestamp = blockData.timestamp;
        feeCollection.extrinsicId = multiRedeem.extrinsicId;

        await feeCollection.save();
    }

    // Update yield data
    const yieldEvent = event.extrinsic.events.find(event => event.event.method === 'YieldCollected');
    if (yieldEvent) {
        const [,,,,, yieldAmount] = yieldEvent.event.data as unknown as [number, number, Balance, Balance, AccountId, Balance];
        multiRedeem.yieldAmount = BigInt(yieldAmount.toString());

        const yieldCollection = new YieldCollection(multiRedeemId);
        yieldCollection.addressId = redeemer.toString();
        yieldCollection.poolId = poolId;
        yieldCollection.operation = Operation.PROPORTION_REDEEM;
        yieldCollection.amount = BigInt(yieldAmount.toString());
        yieldCollection.blockId = blockData.id;
        yieldCollection.timestamp = blockData.timestamp;
        yieldCollection.extrinsicId = multiRedeem.extrinsicId;

        await yieldCollection.save();
    }

    // Update hourly data
    const hourlyData = await getHourlyData(poolId, hourTime);
    hourlyData.redeemTx += 1;
    hourlyData.totalTx += 1;
    hourlyData.redeemVolume = hourlyData.redeemVolume + multiRedeem.inputAmount;
    hourlyData.totalVolume = hourlyData.totalVolume + multiRedeem.inputAmount;
    hourlyData.feeVolume = hourlyData.feeVolume + multiRedeem.feeAmount;
    hourlyData.yieldVolume = hourlyData.yieldVolume + multiRedeem.yieldAmount;
    await hourlyData.save();

    // Update daily data
    const dailyData = await getDailyData(poolId, dailyTime);
    dailyData.redeemTx += 1;
    dailyData.totalTx += 1;
    dailyData.redeemVolume = dailyData.redeemVolume + multiRedeem.inputAmount;
    dailyData.totalVolume = dailyData.totalVolume + multiRedeem.inputAmount;
    dailyData.feeVolume = dailyData.feeVolume + multiRedeem.feeAmount;
    dailyData.yieldVolume = dailyData.yieldVolume + multiRedeem.yieldAmount;
    await dailyData.save();

	await multiRedeem.save();
}