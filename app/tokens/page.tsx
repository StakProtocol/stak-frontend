'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { graphqlClient, GET_FLYING_ICOS } from '@/lib/graphql';

interface FlyingICO {
  id: string;
  name: string;
  symbol: string;
  treasury: string;
  vestingStart: string;
  vestingEnd: string;
  tokenCap: string;
  tokensPerUsd: string;
  totalAssets: string;
  investedAssets: string;
  positionCount: string;
  createdAt: string;
}

export default function TokensPage() {
  const [icos, setIcos] = useState<FlyingICO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchICOs() {
      try {
        const data = await graphqlClient.request<{ flyingICOs: FlyingICO[] }>(GET_FLYING_ICOS);
        setIcos(data.flyingICOs);
      } catch (error) {
        console.error('Error fetching ICOs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchICOs();
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(parseFloat(value) / 1e18);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Flying ICOs
          </h1>
          <Link
            href="/tokens/new"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Launch New ICO
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading ICOs...</p>
          </div>
        ) : icos.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No ICOs found</p>
            <Link
              href="/tokens/new"
              className="mt-4 inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create First ICO
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {icos.map((ico) => (
              <Link key={ico.id} href={`/tokens/${ico.id}`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700 hover:border-blue-500">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{ico.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{ico.symbol}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{ico.symbol[0]}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Token Cap:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatNumber(ico.tokenCap)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Assets:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatNumber(ico.totalAssets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Positions:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{ico.positionCount}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {formatAddress(ico.id)}
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

