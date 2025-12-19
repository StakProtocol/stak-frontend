'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useActiveAccount } from "thirdweb/react";
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { parseUnits, isAddress, erc20Abi, type Address } from 'viem';
import toast from 'react-hot-toast';
import VaultFactoryABI from '@/app/abis/VaultFactory.json';

export default function NewVaultPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const [assetDecimals, setAssetDecimals] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    asset: '',
    name: '',
    symbol: '',
    owner: '',
    treasury: '',
    performanceRate: '',
    vestingStart: '',
    vestingEnd: '',
    startingPrice: '',
    divestFee: '',
  });
  const [treasurySameAsOwner, setTreasurySameAsOwner] = useState(false);
  const [useConnectedWallet, setUseConnectedWallet] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    // Don't allow manual changes to owner if using connected wallet
    if (field === 'owner' && useConnectedWallet) {
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));

    // If owner changes and treasury is set to same as owner, update treasury
    if (field === 'owner' && treasurySameAsOwner) {
      setFormData(prev => ({ ...prev, treasury: value }));
    }
  };

  const handleUseConnectedWallet = (checked: boolean) => {
    setUseConnectedWallet(checked);
    if (checked) {
      if (activeAccount?.address) {
        setFormData(prev => ({
          ...prev,
          owner: activeAccount.address,
          treasury: treasurySameAsOwner ? activeAccount.address : prev.treasury
        }));
      } else {
        toast.error('Please connect your wallet first');
        setUseConnectedWallet(false);
      }
    }
  };

  const handleTreasurySameAsOwner = (checked: boolean) => {
    setTreasurySameAsOwner(checked);
    if (checked && formData.owner) {
      setFormData(prev => ({ ...prev, treasury: formData.owner }));
    }
  };

  // Fetch asset decimals when asset address changes
  useEffect(() => {
    async function fetchDecimals() {
      if (!formData.asset || !isAddress(formData.asset)) {
        setAssetDecimals(null);
        return;
      }

      try {
        const decimals = await readContract(config, {
          address: formData.asset as Address,
          abi: erc20Abi,
          functionName: 'decimals',
          args: [],
        });
        setAssetDecimals(Number(decimals));
      } catch (error) {
        console.error('Error fetching decimals:', error);
        setAssetDecimals(null);
        toast.error('Failed to fetch token decimals. Please check the asset address.');
      }
    }

    fetchDecimals();
  }, [formData.asset]);

  const checkForm = () => {
    const { asset, owner, treasury, performanceRate, vestingStart, vestingEnd, startingPrice, divestFee } = formData;

    if (!isAddress(asset)) {
      toast.error(`Invalid address format for accepted asset: ${asset}`);
    }

    if (!isAddress(owner)) {
      toast.error(`Invalid address format for accepted owner: ${owner}`);
    }

    if (!isAddress(treasury)) {
      toast.error(`Invalid address format for accepted treasury: ${treasury}`);
    }

    if (assetDecimals === null) {
      toast.error('Please wait for asset decimals to be fetched, or check the asset address');
      return false;
    }

    if (Number(performanceRate) < 0 || Number(performanceRate) > 50) {
      toast.error('Performance rate must be between 0 and 50');
      return false;
    }

    if (Number(divestFee) < 0 || Number(divestFee) > 50) {
      toast.error('Redemption fee must be between 0 and 50');
      return false;
    }

    if (!startingPrice || Number(startingPrice) <= 0) {
      toast.error('Starting price must be greater than 0');
      return false;
    }

    if (!vestingStart) {
      toast.error('Vesting start date is required');
      return false;
    }

    if (!vestingEnd) {
      toast.error('Vesting end date is required');
      return false;
    }

    // Check vesting dates
    const startDate = new Date(vestingStart);
    const endDate = new Date(vestingEnd);
    const now = new Date();

    if (startDate <= now) {
      toast.error('Vesting start must be in the future');
      return false;
    }

    if (endDate <= startDate) {
      toast.error('Vesting end must be after vesting start');
      return false;
    }

    return true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount?.address) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      // Note: You'll need to set the factory contract address
      const factoryAddress = process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS as `0x${string}`;

      if (!factoryAddress) {
        toast.error('Factory contract address not configured');
        setLoading(false);
        return;
      }

      if (!checkForm()) {
        setLoading(false);
        return;
      }

      if (assetDecimals === null) {
        toast.error('Asset decimals not available. Please check the asset address.');
        setLoading(false);
        return;
      }

      const hash = await writeContract(config, {
        address: factoryAddress,
        abi: VaultFactoryABI,
        functionName: 'createStakVault',
        args: [
          formData.asset as `0x${string}`,
          formData.name,
          formData.symbol,
          formData.owner as `0x${string}`,
          formData.treasury as `0x${string}`,
          parseUnits(formData.performanceRate, 2),
          BigInt(Math.floor(new Date(formData.vestingStart).getTime() / 1000)),
          BigInt(Math.floor(new Date(formData.vestingEnd).getTime() / 1000)),
          parseUnits(formData.startingPrice, assetDecimals),
          parseUnits(formData.divestFee, 2),
        ],
      });

      await waitForTransactionReceipt(config, { hash });
      router.push('/vaults');
    } catch (error) {
      console.error('Error creating vault:', error);
      toast.error('Failed to create vault. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/vaults" className="text-primary hover:text-primary/70 mb-4 inline-block">
          ← Back to Vaults
        </Link>

        <div className="bg-white dark:bg-dark-primary rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Launch New Stak Vault</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset Address
              </label>
              <input
                type="text"
                required
                value={formData.asset}
                onChange={(e) => handleInputChange('asset', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0x..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">ERC-20 token that will be staked in the vault (e.g. USDC, WETH).</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="My Vault"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Human-readable name for the vault. This will also be the ERC-20 name of the vault token.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  required
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="MVLT"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Short ticker symbol for the vault token (e.g. vUSDC).</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Owner Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  disabled={useConnectedWallet}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="0x..."
                />
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="useConnectedWallet"
                    checked={useConnectedWallet}
                    onChange={(e) => handleUseConnectedWallet(e.target.checked)}
                    className="h-4 w-4 text-primary rounded bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="useConnectedWallet" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Use Connected Wallet
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Address with admin permissions for the vault.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Treasury Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.treasury}
                  onChange={(e) => handleInputChange('treasury', e.target.value)}
                  disabled={treasurySameAsOwner}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="0x..."
                />
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="treasurySameAsOwner"
                    checked={treasurySameAsOwner}
                    onChange={(e) => handleTreasurySameAsOwner(e.target.checked)}
                    className="h-4 w-4 text-primary rounded bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="treasurySameAsOwner" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Same as Owner
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Address that will receive performance fees generated by the vault.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Performance Rate
                </label>
                <input
                  type="text"
                  required
                  value={formData.performanceRate}
                  onChange={(e) => handleInputChange('performanceRate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="10"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Performance fee rate (e.g., 10 for 10%)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Redemption Fee
                </label>
                <input
                  type="text"
                  required
                  value={formData.divestFee}
                  onChange={(e) => handleInputChange('divestFee', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="5"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Redemption fee rate (e.g., 5 for 5%)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Starting Price
                {assetDecimals !== null && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    (Decimals: {assetDecimals})
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                value={formData.startingPrice}
                onChange={(e) => handleInputChange('startingPrice', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="1.0"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Initial price per share. Will be parsed with {assetDecimals !== null ? assetDecimals : 'asset'} decimals.
                {assetDecimals === null && formData.asset && isAddress(formData.asset) && (
                  <span className="text-yellow-600 dark:text-yellow-400"> Fetching decimals...</span>
                )}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vesting Start
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.vestingStart}
                  onChange={(e) => handleInputChange('vestingStart', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Timestamp when vesting begins. Before this date, shares become redeemable gradually over time.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vesting End
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.vestingEnd}
                  onChange={(e) => handleInputChange('vestingEnd', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Timestamp when vesting is fully completed.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-primary/20 border hover:bg-primary/40 text-primary font-semibold rounded-lg font-medium transition-colors cursor-pointer"
            >
              {loading ? 'Creating Vault...' : 'Launch Vault'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

