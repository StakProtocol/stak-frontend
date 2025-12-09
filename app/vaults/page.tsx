'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { graphqlClient, GET_STAK_VAULTS } from '@/lib/graphql';

interface StakVault {
  id: string;
  asset: string;
  name: string;
  symbol: string;
  owner: string;
  treasury: string;
  performanceRate: string;
  vestingStart: string;
  vestingEnd: string;
  totalAssets: string;
  investedAssets: string;
  totalPerformanceFees: string;
  redeemsAtNavEnabled: boolean;
  positionCount: string;
  createdAt: string;
}

export default function VaultsPage() {
  const [vaults, setVaults] = useState<StakVault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVaults() {
      try {
        const data = await graphqlClient.request<{ stakVaults: StakVault[] }>(GET_STAK_VAULTS);
        console.log(data);
        setVaults(data.stakVaults);
      } catch (error) {
        console.error('Error fetching vaults:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVaults();
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (value: string, decimals: number = 18) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(parseFloat(value) / 10 ** decimals);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Stak Vaults
          </h1>
          <Link
            href="/vaults/new"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Launch New Vault
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vaults...</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No vaults found</p>
            <Link
              href="/vaults/new"
              className="mt-4 inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Create First Vault
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vaults.map((vault) => (
              <Link key={vault.id} href={`/vaults/${vault.id}`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700 hover:border-purple-500">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{vault.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{vault.symbol}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{vault.symbol[0]}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Assets:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatNumber(vault.totalAssets, 6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Invested:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatNumber(vault.investedAssets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Positions:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{vault.positionCount}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      {vault.redeemsAtNavEnabled && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                          NAV Enabled
                        </span>
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatAddress(vault.id)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

