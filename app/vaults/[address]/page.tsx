'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { graphqlClient, GET_STAK_VAULT } from '@/lib/graphql';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { useAccount } from 'wagmi';

interface StakPosition {
  id: string;
  positionId: string;
  user: string;
  assetAmount: string;
  shareAmount: string;
  sharesBurned: string;
  sharesUnlocked: string;
  assetsReturned: string;
  assetsReleased: string;
  isClosed: boolean;
  createdAt: string;
}

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
  positions: StakPosition[];
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function VaultDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const { address: userAddress, isConnected } = useAccount();
  const [vault, setVault] = useState<StakVault | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVault() {
      try {
        const data = await graphqlClient.request<{ stakVault: StakVault }>(GET_STAK_VAULT, { id: address.toLowerCase() });
        setVault(data.stakVault);
      } catch (error) {
        console.error('Error fetching vault:', error);
      } finally {
        setLoading(false);
      }
    }
    if (address) {
      fetchVault();
    }
  }, [address]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value) / 1e18;
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 4,
    }).format(num);
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  // Calculate utilization rate
  const utilizationRate = vault && parseFloat(vault.totalAssets) > 0
    ? (parseFloat(vault.investedAssets) / parseFloat(vault.totalAssets)) * 100
    : 0;

  // Pie chart data
  const pieData = vault ? [
    {
      name: 'Total Assets',
      value: parseFloat(vault.totalAssets) / 1e18,
    },
    {
      name: 'Invested Assets',
      value: parseFloat(vault.investedAssets) / 1e18,
    },
    {
      name: 'Performance Fees',
      value: parseFloat(vault.totalPerformanceFees) / 1e18,
    },
  ] : [];

  // Vesting schedule data
  const vestingData = vault ? (() => {
    const start = parseInt(vault.vestingStart);
    const end = parseInt(vault.vestingEnd);
    const duration = end - start;
    const steps = 10;
    const step = duration / steps;
    
    return Array.from({ length: steps + 1 }, (_, i) => {
      const time = start + step * i;
      const unlocked = vault.positions.reduce((sum, pos) => {
        const vestingProgress = Math.min(1, Math.max(0, (time - parseInt(pos.createdAt)) / (end - parseInt(pos.createdAt))));
        return sum + (parseFloat(pos.sharesUnlocked) / 1e18);
      }, 0);
      
      return {
        time: formatDate(time.toString()),
        unlocked,
        locked: vault.positions.reduce((sum, pos) => sum + parseFloat(pos.shareAmount) / 1e18, 0) - unlocked,
      };
    });
  })() : [];

  const userPositions = vault?.positions.filter(pos => 
    isConnected && pos.user.toLowerCase() === userAddress?.toLowerCase()
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <Navbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vault details...</p>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Vault not found</p>
          <Link href="/vaults" className="mt-4 inline-block text-purple-600 hover:text-purple-700">
            Back to Vaults
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/vaults" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
          ← Back to Vaults
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{vault.name}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">{vault.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Contract</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{formatAddress(vault.id)}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(vault.totalAssets)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Invested Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(vault.investedAssets)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Utilization Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{utilizationRate.toFixed(2)}%</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Positions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{vault.positionCount}</p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Asset Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber((value * 1e18).toString())} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vesting Schedule Chart */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Vesting Schedule</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vestingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="unlocked" stroke="#8b5cf6" name="Unlocked Shares" />
                  <Line type="monotone" dataKey="locked" stroke="#ec4899" name="Locked Shares" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Backing Assets vs Contract Balances */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Backing Assets vs Contract Balances</h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Backing Balance</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(vault.totalAssets)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Contract Balance</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(vault.totalAssets)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Positions */}
          {isConnected && userPositions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Positions</h2>
              <div className="space-y-4">
                {userPositions.map((position) => (
                  <div key={position.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <div className="grid md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Position ID</p>
                        <p className="font-medium text-gray-900 dark:text-white">{position.positionId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Share Amount</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatNumber(position.shareAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Unlocked</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatNumber(position.sharesUnlocked)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Released</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatNumber(position.assetsReleased)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm">
                          Divest
                        </button>
                        <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm">
                          Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Positions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">All Positions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">User</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Asset Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Share Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Unlocked</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vault.positions.map((position) => (
                    <tr key={position.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-4 text-sm font-mono text-gray-900 dark:text-white">
                        {formatAddress(position.user)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                        {formatNumber(position.assetAmount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                        {formatNumber(position.shareAmount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                        {formatNumber(position.sharesUnlocked)}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        {position.isClosed ? (
                          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                            Closed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

