export const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatNumber = (value: string, decimals: string = "18") => {
    return Number(parseFloat(value) / 10 ** Number(decimals));
};

// List of ICO addresses that should not be displayed
export const EXCLUDED_ICO_ADDRESSES: string[] = [
    '0x50ea451dd8e2bbe698a2b3944b6768301b6a4d71',
    '0xecb1d394b771462f3dbe2064e51bc1334dd935cb',
];

// List of Vault addresses that should not be displayed
export const EXCLUDED_VAULT_ADDRESSES: string[] = [
    // Add Vault addresses to exclude here
    // Example: '0x1234567890123456789012345678901234567890',
];