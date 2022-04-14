import { Option } from '@polkadot/types/codec';
import { Codec } from '@polkadot/types/types';
import { getNumber } from './number';

export interface PoolInfo {
    totalSupply: number;
    balances: number[];
    feeBalance: number;
    yieldBalance: number;
}

export const getPoolDecimals = async (poolId: number) => {
    const poolInfo = (await api.query.stableAsset.pools(poolId) as Option<Codec>).unwrap();
    return Math.log10((poolInfo as any).precision);
}

export const getPoolInfo = async (poolId: number): Promise<PoolInfo> => {
    const poolInfo = (await api.query.stableAsset.pools(poolId) as Option<Codec>).toJSON() as any;
    const decimals = Math.log10(poolInfo.precision);

    const totalSupply = getNumber(poolInfo.totalSupply, decimals);
    const balances = poolInfo.balances.map(balance => getNumber(balance, decimals));

    const feeAccount = (await api.query.tokens.accounts(poolInfo.feeRecipient.toString(), { StableAssetPoolToken: 0 }) as Option<Codec>).toJSON() as any;
    const yieldAccount = (await api.query.tokens.accounts(poolInfo.yieldRecipient.toString(), { StableAssetPoolToken: 0 }) as Option<Codec>).toJSON() as any;
    const feeBalance = getNumber(feeAccount.free, decimals);
    const yieldBalance = getNumber(yieldAccount.free, decimals);

    return {
        totalSupply,
        balances,
        feeBalance,
        yieldBalance
    };
}