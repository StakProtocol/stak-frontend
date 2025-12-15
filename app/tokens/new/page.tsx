'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { isAddress } from 'viem';
import toast from 'react-hot-toast';
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

  const addArrayItem = () => {
    setFormData(prev => ({
      ...prev,
      acceptedAssets: [...prev.acceptedAssets, ''],
      priceFeeds: [...prev.priceFeeds, ''],
      frequencies: [...prev.frequencies, '']
    }));
  };

  const removeArrayItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      acceptedAssets: prev.acceptedAssets.filter((_, i) => i !== index),
      priceFeeds: prev.priceFeeds.filter((_, i) => i !== index),
      frequencies: prev.frequencies.filter((_, i) => i !== index)
    }));
  };

  const checkForm = () => {
    // Check required fields
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }

    if (!formData.symbol.trim()) {
      toast.error('Symbol is required');
      return false;
    }

    if (!formData.tokenCap.trim() || isNaN(Number(formData.tokenCap)) || Number(formData.tokenCap) <= 0) {
      toast.error('Token Cap must be a valid positive number');
      return false;
    }

    if (!formData.tokensPerUsd.trim() || isNaN(Number(formData.tokensPerUsd)) || Number(formData.tokensPerUsd) <= 0) {
      toast.error('Tokens Per USD must be a valid positive number');
      return false;
    }

    // Check arrays are not empty and have valid values
    const validAcceptedAssets = formData.acceptedAssets.filter(a => a.trim() !== '');
    const validPriceFeeds = formData.priceFeeds.filter(p => p.trim() !== '');
    const validFrequencies = formData.frequencies.filter(f => f.trim() !== '');

    if (validAcceptedAssets.length === 0) {
      toast.error('At least one accepted asset is required');
      return false;
    }

    if (validPriceFeeds.length === 0) {
      toast.error('At least one price feed is required');
      return false;
    }

    if (validFrequencies.length === 0) {
      toast.error('At least one frequency is required');
      return false;
    }

    // Check arrays have same length
    if (validAcceptedAssets.length !== validPriceFeeds.length ||
      validAcceptedAssets.length !== validFrequencies.length) {
      toast.error('Accepted assets, price feeds, and frequencies must have the same number of entries');
      return false;
    }

    // Validate addresses
    for (const asset of validAcceptedAssets) {
      if (!isAddress(asset)) {
        toast.error(`Invalid address format for accepted asset: ${asset}`);
        return false;
      }
    }

    for (const feed of validPriceFeeds) {
      if (!isAddress(feed)) {
        toast.error(`Invalid address format for price feed: ${feed}`);
        return false;
      }
    }

    // Validate frequencies are positive numbers
    for (const freq of validFrequencies) {
      if (isNaN(Number(freq)) || Number(freq) <= 0) {
        toast.error(`Frequency must be a positive number: ${freq}`);
        return false;
      }
    }

    if (!formData.sequencer.trim() || !isAddress(formData.sequencer)) {
      toast.error('Valid sequencer address is required');
      return false;
    }

    if (!formData.treasury.trim() || !isAddress(formData.treasury)) {
      toast.error('Valid treasury address is required');
      return false;
    }

    if (!formData.vestingStart) {
      toast.error('Vesting start date is required');
      return false;
    }

    if (!formData.vestingEnd) {
      toast.error('Vesting end date is required');
      return false;
    }

    // Check vesting dates
    const startDate = new Date(formData.vestingStart);
    const endDate = new Date(formData.vestingEnd);
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

    setLoading(true);
    try {
      // Run form validation
      if (!checkForm()) {
        setLoading(false);
        return;
      }
      // Filter out empty strings
      const acceptedAssets = formData.acceptedAssets.filter(a => a.trim() !== '');
      const priceFeeds = formData.priceFeeds.filter(p => p.trim() !== '');
      const frequencies = formData.frequencies.filter(f => f.trim() !== '').map(f => BigInt(f));

      // Note: You'll need to set the factory contract address
      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_FLYING_ICO_ADDRESS as `0x${string}`;

      if (!factoryAddress) {
        toast.error('Factory contract address not configured');
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
          BigInt(formData.tokenCap),
          BigInt(formData.tokensPerUsd),
          acceptedAssets as `0x${string}`[],
          priceFeeds as `0x${string}`[],
          frequencies,
          formData.sequencer as `0x${string}`,
          formData.treasury as `0x${string}`,
          BigInt(Math.floor(new Date(formData.vestingStart).getTime() / 1000)),
          BigInt(Math.floor(new Date(formData.vestingEnd).getTime() / 1000)),
        ],
      });

      await waitForTransactionReceipt(config, { hash });
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white dark:bg-dark-primary rounded-2xl shadow-lg">
            <p className="text-gray-600 font-medium dark:text-gray-200 my-2">Please connect your wallet to create a new ICO</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tokens" className="text-primary hover:text-primary/70 mb-4 inline-block">
          ← Back to ICOs
        </Link>

        <div className="bg-white dark:bg-dark-primary rounded-2xl shadow-lg p-8">
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
                placeholder="MTK"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Short ticker symbol for the vault token (e.g. vUSDC).</p>
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
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maximum number of tokens that can ever be minted. Once reached, no more tokens can be issued.</p>
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
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Number of tokens minted per USD of the underlying asset.</p>
              </div>
            </div>

            {/* Grouped Asset Configuration */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Asset Configuration</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addArrayItem}
                    className="inline-flex cursor-pointer items-center px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Asset
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure the accepted assets, their price feeds, and update frequencies. All three fields must be provided for each asset.
              </p>

              <div className="space-y-4">
                {formData.acceptedAssets.map((_, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Asset Address
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.acceptedAssets[index]}
                        onChange={(e) => handleArrayChange('acceptedAssets', index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="0x..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">ERC-20 token address (e.g. USDC, WETH)</p>

                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Price Feed
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.priceFeeds[index]}
                        onChange={(e) => handleArrayChange('priceFeeds', index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="0x..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Chainlink price feed address</p>

                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Frequency (seconds)
                        </label>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.frequencies[index]}
                        onChange={(e) => handleArrayChange('frequencies', index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="3600"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Update interval (e.g. 3600 for 1 hour)</p>
                    </div>

                    {formData.acceptedAssets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem(index)}
                        className="inline-flex cursor-pointer w-fit items-center px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md text-xs font-medium transition-colors"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Chainlink Sequencer Uptime Feed address.</p>
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
              {loading ? 'Creating ICO...' : 'Launch ICO'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

