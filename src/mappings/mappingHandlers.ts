import { SubstrateEvent } from "@subql/types";
import { mint, swap, proportionRedeem, singleRedeem, multiRedeem } from '../handlers';

export async function handleMint(event: SubstrateEvent): Promise<void> {
    await mint(event);
}

export async function handleSwap(event: SubstrateEvent): Promise<void> {
    await swap(event);
}

export async function handleProportionRedeem(event: SubstrateEvent): Promise<void> {
    await proportionRedeem(event);
}

export async function handleSingleRedeem(event: SubstrateEvent): Promise<void> {
    await singleRedeem(event);
}

export async function handleMultiRedeem(event: SubstrateEvent): Promise<void> {
    await multiRedeem(event);
}
