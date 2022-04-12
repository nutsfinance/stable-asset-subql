import { SubstrateEvent } from "@subql/types";
import { AccountId, Balance } from "@acala-network/types/interfaces";
import { ensureBlock, ensureExtrinsic } from ".";
import { getAccount, getMint, getHourlyData, getDailyData, getStartOfHour, getStartOfDay, getNumber, getPoolDecimals } from "../utils";
import { FeeCollection, YieldCollection, Operation } from "../types";

export const mint = async (event: SubstrateEvent) => {
    logger.info('Mint Events: ' + JSON.stringify(event));
    // logger.info('Event index: ' + event.idx)
    // logger.info(JSON.stringify(event.extrinsic.events.map(event => event.event.method)))
    // [minter, pool id, a, input amounts, min output, balances, total supply, fee amount, output amount]
    const [minter, poolId, a, intputAmounts, minOutputAmount, balances, totalSupply, feeAmount, outputAmount] = event.event.data as unknown as [AccountId, number, number, Balance[], Balance, Balance[], Balance, Balance, Balance];
    // logger.info('minter: ' + minter.toString());
    // logger.info('poolId: ' +  poolId);
    // logger.info('a:' + a);
    // logger.info('inputAmounts:' + JSON.stringify(intputAmounts))
    // logger.info('min: ' +  minOutputAmount)
    // logger.info('balances: ' + balances)
    // logger.info('totalSupply: ' + totalSupply)
    // logger.info('feeAmount: ' +  feeAmount)
    // logger.info('outputAmount:' +  outputAmount)
    const blockData = await ensureBlock(event);
    const hourTime = getStartOfHour(blockData.timestamp);
	const dailyTime = getStartOfDay(blockData.timestamp);

    const mintId = `${blockData.hash}-${event.idx.toString()}`;
    logger.info('Mint ID: ' + mintId)
    const mint = await getMint(mintId);

    mint.addressId = minter.toString();
    mint.poolId = poolId;
    mint.a = a;
    mint.inputAmounts = intputAmounts.map(amount => amount.toString()).join();
    mint.mintOutputAmount = BigInt(minOutputAmount.toString());
    mint.balances = balances.map(amount => amount.toString()).join();
    mint.totalSupply = BigInt(totalSupply.toString());
    mint.feeAmount = BigInt(feeAmount.toString());
    mint.outputAmount = BigInt(outputAmount.toString());

    mint.blockId = blockData.id
    mint.timestamp = blockData.timestamp;

    // Update extrinsic data
    if (event.extrinsic) {
		const extrinsicData = await ensureExtrinsic(event);
		mint.extrinsicId = extrinsicData.id;
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
        mint.feeAmount += BigInt(feeAmount.toString());
    }
    if (mint.feeAmount > 0) {
        const feeCollection = new FeeCollection(mintId);
        feeCollection.addressId = minter.toString();
        feeCollection.poolId = poolId;
        feeCollection.operation = Operation.MINT;
        feeCollection.amount = mint.feeAmount;
        feeCollection.blockId = blockData.id;
        feeCollection.timestamp = blockData.timestamp;
        feeCollection.extrinsicId = mint.extrinsicId;

        await feeCollection.save();
    }

    // Update yield data
    const yieldEvent = event.extrinsic.events.find(event => event.event.method === 'YieldCollected');
    if (yieldEvent) {
        const [,,,,, yieldAmount] = yieldEvent.event.data as unknown as [number, number, Balance, Balance, AccountId, Balance];
        mint.yieldAmount = BigInt(yieldAmount.toString());

        const yieldCollection = new YieldCollection(mintId);
        yieldCollection.addressId = minter.toString();
        yieldCollection.poolId = poolId;
        yieldCollection.operation = Operation.MINT;
        yieldCollection.amount = BigInt(yieldAmount.toString());
        yieldCollection.blockId = blockData.id;
        yieldCollection.timestamp = blockData.timestamp;
        yieldCollection.extrinsicId = mint.extrinsicId;

        await yieldCollection.save();
    }

    const decimals = getPoolDecimals(poolId);
    // Update hourly data
    const hourlyData = await getHourlyData(poolId, hourTime);
    hourlyData.mintTx += 1;
    hourlyData.totalTx += 1;
    hourlyData.mintVolume += getNumber(mint.outputAmount, decimals);
    hourlyData.totalVolume += getNumber(mint.outputAmount, decimals);
    hourlyData.feeVolume += getNumber(mint.feeAmount, decimals);
    hourlyData.yieldVolume += getNumber(mint.yieldAmount, decimals);
    await hourlyData.save();

    // Update daily data
    const dailyData = await getDailyData(poolId, dailyTime);
    dailyData.mintTx += 1;
    dailyData.totalTx += 1;
    dailyData.mintVolume = getNumber(mint.outputAmount, decimals);
    dailyData.totalVolume = getNumber(mint.outputAmount, decimals);
    dailyData.feeVolume = getNumber(mint.feeAmount, decimals);
    dailyData.yieldVolume = getNumber(mint.yieldAmount, decimals);
    await dailyData.save();

	await mint.save();
}