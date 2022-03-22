import { SubstrateEvent } from "@subql/types";
import { mint } from '../handlers';

export async function handleMint(event: SubstrateEvent): Promise<void> {
    await mint(event);
}


