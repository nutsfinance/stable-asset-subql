import { SubstrateEvent } from "@subql/types";
import { AccountId, Balance } from "@acala-network/types/interfaces";
import { ensureBlock, ensureExtrinsic } from ".";
import { getAccount, getMint } from "../utils";
import { Mint } from "../types";

export const mint = async (event: SubstrateEvent) => {
    // logger.info('Events: ' + JSON.stringify(event));
    // logger.info(event.idx)
    // logger.info(JSON.stringify(event.extrinsic.idx));
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

    const mintId = `${blockData.hash}-${event.event.index.toString()}`;
    // logger.info('Mint ID: ' + mintId)
    const mint = await getMint(mintId);

    mint.addressId = minter.toString();
    mint.poolId = poolId;
    mint.a = a;
    mint.inputAmounts = intputAmounts.map(amount => BigInt(amount.toString()));
    mint.mintOutputAmount = BigInt(minOutputAmount.toString());
    mint.balances = balances.map(amount => BigInt(amount.toString()));
    mint.totalSupply = BigInt(totalSupply.toString());
    mint.feeAmount = BigInt(feeAmount.toString());
    mint.outputAmount = BigInt(outputAmount.toString());

    mint.blockId = blockData.id
    mint.timestamp = blockData.timestamp;

    if (event.extrinsic) {
		const extrinsicData = await ensureExtrinsic(event);
		mint.extrinsicId = extrinsicData.id;
		await getAccount(event.extrinsic.extrinsic.signer.toString());

		extrinsicData.section = event.event.section;
		extrinsicData.method = event.event.method;
		extrinsicData.addressId = event.extrinsic.extrinsic.signer.toString();

		await extrinsicData.save();
	}

	await mint.save();

    const readMint = await Mint.get(mintId);
}