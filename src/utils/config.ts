export const POOL_CONFIG = [
    {
        decimals: 12
    }
];

export const getPoolDecimals = (poolId: number) => {
    return POOL_CONFIG[poolId].decimals;
}