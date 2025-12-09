'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransaction } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { parseEther } from 'viem';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      // Note: You'll need to set the factory contract address
      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_STAK_VAULT_ADDRESS as `0x${string}`;
      
      if (!factoryAddress) {
        alert('Factory contract address not configured');
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
          parseEther(formData.performanceRate),
          BigInt(Math.floor(new Date(formData.vestingStart).getTime() / 1000)),
          BigInt(Math.floor(new Date(formData.vestingEnd).getTime() / 1000)),
        ],
      });

      await waitForTransaction(config, { hash });
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please connect your wallet to create a new vault</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/vaults" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
          ← Back to Vaults
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
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
                placeholder="0.1"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Performance fee rate (e.g., 0.1 for 10%)</p>
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
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating Vault...' : 'Launch Vault'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

