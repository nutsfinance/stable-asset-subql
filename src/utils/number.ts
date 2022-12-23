import BigNumber from "bignumber.js";

export const getNumber = (value: string | BigInt, decimals: number) => {
    const denominator = new BigNumber(10).exponentiatedBy(new BigNumber(decimals));
    return new BigNumber(value.toString()).dividedBy(denominator).toNumber();
}