'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { parseUnits, isAddress } from 'viem';
import toast from 'react-hot-toast';
import FactoryStakVaultABI from '@/app/abis/FactoryStakVault.json';

export default function NewVaultPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset: '',
    name: '',
    symbol: '',
    owner: '',
    treasury: '',
    performanceRate: '',
    vestingStart: '',
    vestingEnd: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const checkForm = () => {
    const { asset, owner, treasury, performanceRate, vestingStart, vestingEnd } = formData;

    if (!isAddress(asset) || !isAddress(owner) || !isAddress(treasury)) {
      toast.error('Please enter valid addresses');
      return false;
    }

    if (Number(performanceRate) < 0 || Number(performanceRate) > 50) {
      toast.error('Performance rate must be between 0 and 50');
      return false;
    }

    if (new Date(vestingStart) >= new Date(vestingEnd)) {
      toast.error('Vesting start must be before vesting end');
      return false;
    }

    return true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      // Note: You'll need to set the factory contract address
      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_STAK_VAULT_ADDRESS as `0x${string}`;

      if (!factoryAddress) {
        toast.error('Factory contract address not configured');
        setLoading(false);
        return;
      }

      if (!checkForm()) {
        setLoading(false);
        return;
      }

      const hash = await writeContract(config, {
        address: factoryAddress,
        abi: FactoryStakVaultABI,
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
        ],
      });

      await waitForTransactionReceipt(config, { hash });
      router.push('/vaults');
    } catch (error) {
      console.error('Error creating vault:', error);
      alert('Failed to create vault. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white dark:bg-dark-primary rounded-2xl shadow-lg">
            <p className="text-gray-600 font-medium dark:text-gray-200 my-2">Please connect your wallet to create a new vault</p>
          </div>
        </div>
      </div>
    );
  }

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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0x..."
                />
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0x..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Address that will receive performance fees generated by the vault.</p>
              </div>
            </div>

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

