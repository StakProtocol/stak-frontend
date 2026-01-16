import { use } from "react";
import Image from 'next/image';

import { formatNumber, formatAddress, EXCLUDED_VAULT_ADDRESSES } from '@/app/utils/helper';
import { getTokenPicture } from '@/app/utils/logos';
import Link from 'next/link';
import { MinStakVault } from '@/lib/types';


function EmptyList() {
    return (
        <div className="text-center py-12 bg-white dark:bg-dark-primary rounded-2xl shadow-lg">
            <p className="text-gray-600 font-medium dark:text-gray-200 text-lg">No Vaults found</p>
        </div>
    )
}

export function VaultsList({ vaultsPromise }: { vaultsPromise: Promise<MinStakVault[]> }) {
    const vaults = use(vaultsPromise);

    if (!vaults || !vaults.length) return <EmptyList />

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {
                vaults.filter(vault => !EXCLUDED_VAULT_ADDRESSES.includes(vault.id)).map((vault) => {
                const total = formatNumber(vault.totalAssets, vault.decimals) + formatNumber(vault.investedAssets, vault.decimals);
                return (
                    <Link key={vault.id} href={`/vaults/${vault.id}`}>
                        <div className="bg-white dark:bg-dark-primary rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-200 dark:border-gray-700 hover:border-primary">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{vault.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{vault.symbol}</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                    <Image
                                        src={getTokenPicture('sepolia', vault.asset)}
                                        alt={vault.symbol}
                                        width={32}
                                        height={32}
                                        className="rounded-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Total Assets:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Total Supply:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(vault.totalSupply, vault.decimals)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Positions:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{vault.positionCount}</span>
                                </div>
                                <div className="flex justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatAddress(vault.id)}
                                    </span>
                                    {vault.redeemsAtNavEnabled && (
                                        <span className="px-2 py-1 bg-green-100 dark:bg-primary text-green-800 dark:text-black text-xs rounded">
                                            NAV Enabled
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}