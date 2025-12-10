export const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatNumber = (value: string, decimals: string = "18") => {
    return Number(parseFloat(value) / 10 ** Number(decimals));
};