import { useEffect, useState } from 'react'
import { useActiveAccount } from "thirdweb/react";
import { PositionCard } from '@/components/PositionCard';
import { StakVault } from '@/lib/types';

interface UserPositionsProps {
    vault: StakVault;
    divestFee: number;
    pricePerShare: number;
    vestingRate: number;
    vaultAddress: string;
}

export function UserPositions({ vault, divestFee, pricePerShare, vestingRate, vaultAddress}: UserPositionsProps) {
    const [mounted, setMounted] = useState(false)
    const activeAccount = useActiveAccount()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const isConnected = !!activeAccount
    const userPositions = vault?.positions.filter(pos => isConnected && pos.user.toLowerCase() === activeAccount?.address.toLowerCase()) || [];

    if (!userPositions) return null

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Positions</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {userPositions.map((position) => (
                    <PositionCard
                        key={position.id}
                        position={position}
                        vaultAddress={vaultAddress as `0x${string}`}
                        vaultDecimals={vault.decimals}
                        vestingRate={vestingRate}
                        pricePerShare={pricePerShare}
                        assetAddress={vault.asset as `0x${string}`}
                        vaultSymbol={vault.symbol}
                        vaultDivestFee={divestFee}
                    />
                ))}
            </div>
        </div>
    )
}
