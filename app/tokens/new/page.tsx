'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransaction } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { parseEther } from 'viem';
import FactoryFlyingICOABI from '@/app/abis/FactoryFlyingICO.json';

export default function NewTokenPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    tokenCap: '',
    tokensPerUsd: '',
    acceptedAssets: [''],
    priceFeeds: [''],
    frequencies: [''],
    sequencer: '',
    treasury: '',
    vestingStart: '',
    vestingEnd: '',
  });

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'acceptedAssets' | 'priceFeeds' | 'frequencies', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'acceptedAssets' | 'priceFeeds' | 'frequencies') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'acceptedAssets' | 'priceFeeds' | 'frequencies', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      // Validate arrays have same length
      if (
        formData.acceptedAssets.length !== formData.priceFeeds.length ||
        formData.acceptedAssets.length !== formData.frequencies.length
      ) {
        alert('Accepted assets, price feeds, and frequencies arrays must have the same length');
        setLoading(false);
        return;
      }

      // Filter out empty strings
      const acceptedAssets = formData.acceptedAssets.filter(a => a.trim() !== '');
      const priceFeeds = formData.priceFeeds.filter(p => p.trim() !== '');
      const frequencies = formData.frequencies.filter(f => f.trim() !== '').map(f => parseEther(f));

      // Note: You'll need to set the factory contract address
      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_FLYING_ICO_ADDRESS as `0x${string}`;
      
      if (!factoryAddress) {
        alert('Factory contract address not configured');
        setLoading(false);
        return;
      }

      const hash = await writeContract(config, {
        address: factoryAddress,
        abi: FactoryFlyingICOABI,
        functionName: 'createFlyingIco',
        args: [
          formData.name,
          formData.symbol,
          parseEther(formData.tokenCap),
          parseEther(formData.tokensPerUsd),
          acceptedAssets as `0x${string}`[],
          priceFeeds as `0x${string}`[],
          frequencies,
          formData.sequencer as `0x${string}`,
          formData.treasury as `0x${string}`,
          BigInt(Math.floor(new Date(formData.vestingStart).getTime() / 1000)),
          BigInt(Math.floor(new Date(formData.vestingEnd).getTime() / 1000)),
        ],
      });

      await waitForTransaction(config, { hash });
      router.push('/tokens');
    } catch (error) {
      console.error('Error creating ICO:', error);
      alert('Failed to create ICO. Please check the console for details.');
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
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please connect your wallet to create a new ICO</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tokens" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to ICOs
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Launch New Flying ICO</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="My Token"
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
                placeholder="MTK"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Cap
                </label>
                <input
                  type="text"
                  required
                  value={formData.tokenCap}
                  onChange={(e) => handleInputChange('tokenCap', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tokens Per USD
                </label>
                <input
                  type="text"
                  required
                  value={formData.tokensPerUsd}
                  onChange={(e) => handleInputChange('tokensPerUsd', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Accepted Assets Array */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accepted Assets
              </label>
              {formData.acceptedAssets.map((asset, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    required
                    value={asset}
                    onChange={(e) => handleArrayChange('acceptedAssets', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0x..."
                  />
                  {formData.acceptedAssets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('acceptedAssets', index)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('acceptedAssets')}
                className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
              >
                + Add Asset
              </button>
            </div>

            {/* Price Feeds Array */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Feeds
              </label>
              {formData.priceFeeds.map((feed, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    required
                    value={feed}
                    onChange={(e) => handleArrayChange('priceFeeds', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0x..."
                  />
                  {formData.priceFeeds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('priceFeeds', index)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('priceFeeds')}
                className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
              >
                + Add Price Feed
              </button>
            </div>

            {/* Frequencies Array */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequencies
              </label>
              {formData.frequencies.map((freq, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    required
                    value={freq}
                    onChange={(e) => handleArrayChange('frequencies', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="3600"
                  />
                  {formData.frequencies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('frequencies', index)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('frequencies')}
                className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
              >
                + Add Frequency
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sequencer Address
              </label>
              <input
                type="text"
                required
                value={formData.sequencer}
                onChange={(e) => handleInputChange('sequencer', e.target.value)}
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
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating ICO...' : 'Launch ICO'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

