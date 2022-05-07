import { SubstrateEvent } from "@subql/types";
import { AccountId, Balance } from "@acala-network/types/interfaces";
import { ensureBlock, ensureExtrinsic } from ".";
import { getAccount, getProportionRedeem, getHourlyData, getDailyData, getStartOfHour, getStartOfDay, getNumber, getPoolDecimals } from "../utils";
import { FeeCollection, YieldCollection, Operation } from "../types";

export const proportionRedeem = async (event: SubstrateEvent) => {
    logger.info('Proportion Redeem Events: ' + JSON.stringify(event));
    // [redeemer, pool id, a, input amount, min_output_amounts, balances, total supply, fee amount, output amount]
    const [redeemer, poolId, a, inputAmount, minOutputAmounts, balances, totalSupply, feeAmount, outputAmounts] = event.event.data as unknown as [AccountId, number, number, Balance, Balance[], Balance[], Balance, Balance, Balance[]];
    const blockData = await ensureBlock(event);
    // logger.info('redeemer: ' + redeemer.toString());
    // logger.info('poolId: ' +  poolId);
    // logger.info('a:' + a);
    // logger.info('inputAmount: ' + inputAmount)
    // logger.info('min: ' +  minOutputAmounts)
    // logger.info('balances: ' + balances)
    // logger.info('totalSupply: ' + totalSupply)
    // logger.info('feeAmount: ' + feeAmount)
    // logger.info('outputAmounts:' +  outputAmounts)
    const hourTime = getStartOfHour(blockData.timestamp);
	const dailyTime = getStartOfDay(blockData.timestamp);

    const proportionRedeemId = `${blockData.hash}-${event.idx.toString()}`;
    logger.info('Redeem ID: ' + proportionRedeemId)
    const proportionRedeem = await getProportionRedeem(proportionRedeemId);

    proportionRedeem.addressId = redeemer.toString();
    proportionRedeem.poolId = poolId;
    proportionRedeem.a = a;
    proportionRedeem.inputAmount = BigInt(inputAmount.toString());
    proportionRedeem.minOutputAmounts = minOutputAmounts.map(amount => amount.toString()).join();
    proportionRedeem.balances = balances.map(amount => amount.toString()).join();
    proportionRedeem.totalSupply = BigInt(totalSupply.toString());
    proportionRedeem.feeAmount = BigInt(feeAmount.toString());
    proportionRedeem.outputAmounts = outputAmounts.map(amount => amount.toString()).join();

    proportionRedeem.blockId = blockData.id
    proportionRedeem.timestamp = blockData.timestamp;

    // Update extrinsic data
    if (event.extrinsic) {
		const extrinsicData = await ensureExtrinsic(event);
		proportionRedeem.extrinsicId = extrinsicData.id;
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
        proportionRedeem.feeAmount += BigInt(feeAmount.toString());
    }
    if (proportionRedeem.feeAmount > 0) {
        const feeCollection = new FeeCollection(proportionRedeemId);
        feeCollection.addressId = redeemer.toString();
        feeCollection.poolId = poolId;
        feeCollection.operation = Operation.PROPORTION_REDEEM;
        feeCollection.amount = proportionRedeem.feeAmount;
        feeCollection.blockId = blockData.id;
        feeCollection.timestamp = blockData.timestamp;
        feeCollection.extrinsicId = proportionRedeem.extrinsicId;

        await feeCollection.save();
    }

    // Update yield data
    const yieldEvent = event.extrinsic.events.find(event => event.event.method === 'YieldCollected');
    if (yieldEvent) {
        const [,,,,, yieldAmount] = yieldEvent.event.data as unknown as [number, number, Balance, Balance, AccountId, Balance];
        proportionRedeem.yieldAmount = BigInt(yieldAmount.toString());

        const yieldCollection = new YieldCollection(proportionRedeemId);
        yieldCollection.addressId = redeemer.toString();
        yieldCollection.poolId = poolId;
        yieldCollection.operation = Operation.PROPORTION_REDEEM;
        yieldCollection.amount = BigInt(yieldAmount.toString());
        yieldCollection.blockId = blockData.id;
        yieldCollection.timestamp = blockData.timestamp;
        yieldCollection.extrinsicId = proportionRedeem.extrinsicId;

        await yieldCollection.save();
    }

    const decimals = await getPoolDecimals(poolId);
    // Update hourly data
    const hourlyData = await getHourlyData(poolId, hourTime);
    hourlyData.redeemTx += 1;
    hourlyData.totalTx += 1;
    hourlyData.redeemVolume += getNumber(proportionRedeem.inputAmount, decimals);
    hourlyData.totalVolume += getNumber(proportionRedeem.inputAmount, decimals);
    hourlyData.feeVolume += getNumber(proportionRedeem.feeAmount, decimals);
    hourlyData.yieldVolume += getNumber(proportionRedeem.yieldAmount, decimals);
    await hourlyData.save();

    // Update daily data
    const dailyData = await getDailyData(poolId, dailyTime);
    dailyData.redeemTx += 1;
    dailyData.totalTx += 1;
    dailyData.redeemVolume += getNumber(proportionRedeem.inputAmount, decimals);
    dailyData.totalVolume += getNumber(proportionRedeem.inputAmount, decimals);
    dailyData.feeVolume += getNumber(proportionRedeem.feeAmount, decimals);
    dailyData.yieldVolume += getNumber(proportionRedeem.yieldAmount, decimals);
    await dailyData.save();

	await proportionRedeem.save();
}