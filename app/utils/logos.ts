export const tokens: Record<string, Record<string, string>> = {
  sepolia: {
    // ETHER
    '0x0000000000000000000000000000000000000000': '/tokens/eth.svg',
    // WETH
    '0xb16f35c0ae2912430dac15764477e179d9b9ebea': '/tokens/weth.svg',
    // USDC
    '0xd6eddb13ad13767a2b4ad89ea94fca0c6ab0f8d2': '/tokens/usdc.svg',
    // USDT
    // '': '/tokens/usdt.svg',
    // // DAI
    // '': '/tokens/dai.svg',
    // // WBTC
    // '': '/tokens/wbtc.svg',
    // // USDC
    // '': '/tokens/usdc.svg',
  },
  mainnet: {
    // ETHER
    '0x0000000000000000000000000000000000000000': '/tokens/eth.svg',
    // WETH
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': '/tokens/weth.svg',
    // USDC
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': '/tokens/usdc.svg',
  },
};

export const getTokenPicture = (chain: string, address: string): string => {
  const normalizedAddress = address.toLowerCase();
  return tokens[chain][normalizedAddress] || '/icons/logo.png';
};
