import { SubstrateEvent } from "@subql/types";
import { mint, swap, proportionRedeem } from '../handlers';

export async function handleMint(event: SubstrateEvent): Promise<void> {
    await mint(event);
}

export async function handleSwap(event: SubstrateEvent): Promise<void> {
    await swap(event);
}

export async function handleProportionRedeem(event: SubstrateEvent): Promise<void> {
    await proportionRedeem(event);
}
