'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { graphqlClient, GET_STAK_VAULT } from '@/lib/graphql';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { useAccount, useChainId } from 'wagmi';
import { chainByID } from '@/app/utils/chains';

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
  const chainId = useChainId();
  const [vault, setVault] = useState<StakVault | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentChain = chainByID(chainId);
  const blockExplorerUrl = currentChain.blockExplorerUrl;

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

  const formatNumber = (value: string, decimals: number = 18) => {
    const num = parseFloat(value) / 10 ** decimals; // TODO: fetch from indexer or contract address
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 4,
    }).format(num);
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

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

  const totalAssets = parseFloat(formatNumber(vault.totalAssets, 6)) + parseFloat(formatNumber(vault.investedAssets, 6)) - parseFloat(formatNumber(vault.totalPerformanceFees, 4));
  const investedAssets = parseFloat(formatNumber(vault.investedAssets, 6));
  const performanceFees = parseFloat(formatNumber(vault.totalPerformanceFees, 4));
  // Calculate utilization rate
  const utilizationRate = totalAssets > 0 ? (investedAssets / totalAssets) * 100 : 0;

  const vestingRate = (parseInt(vault.vestingEnd) - (new Date().getTime() / 1000)) / (parseInt(vault.vestingEnd) - parseInt(vault.vestingStart));
  const totalShares = totalAssets; // TODO: change to totalShares
  const sharesVested = totalAssets * (1 - vestingRate); // TODO: change to totalShares

  // console.log('VESTING RATE:', vestingRate);

  // Pie chart data
  const pieData = vault ? [
    {
      name: 'Contract Assets',
      value: parseFloat(formatNumber(vault.totalAssets, 6)),
    },
    {
      name: 'Invested Assets',
      value: parseFloat(formatNumber(vault.investedAssets, 6)),
    },
    {
      name: 'Performance Fees',
      value: parseFloat(formatNumber(vault.totalPerformanceFees, 4)),
    },
  ] : [];

  // Shares distribution data
  const sharesData = vault ? (() => {
    // Calculate shares held by vault (locked shares in positions)
    const sharesLocked = 0.9;
    // Shares not held by vault (unlocked/released shares)
    const sharesUnlocked = totalShares - sharesLocked - sharesVested;

    return [
      {
        name: 'Shares Locked',
        value: sharesLocked,
      },
      {
        name: 'Shares Unlocked',
        value: sharesUnlocked,
      },
      {
        name: 'Shares Vested',
        value: sharesVested,
      },
    ];
  })() : [];

  // Vesting schedule data
  const vestingData = (() => {
    const start = parseInt(vault.vestingStart);
    const end = parseInt(vault.vestingEnd);
    
    // Calculate time range: 1 month before start to 1 month after end
    const oneMonthInSeconds = 30 * 24 * 60 * 60;
    const chartStart = start - oneMonthInSeconds;
    const chartEnd = end + oneMonthInSeconds;
    const totalDuration = chartEnd - chartStart;
    
    // Generate data points (50 points for smooth line)
    const steps = 50;
    const step = totalDuration / steps;
    
    return Array.from({ length: steps + 1 }, (_, i) => {
      const time = chartStart + step * i;
      
      // Calculate vesting rate using the formula from lines 163-165
      let vestingRate = 0;
      if (time < start) {
        // Before vesting starts: nothing is vested
        vestingRate = 1;
      } else if (time > end) {
        // After vesting ends: everything is vested
        vestingRate = 0;
      } else {
        // During vesting period
        vestingRate = (end - time) / (end - start);
      }
      
      // Calculate vested shares: totalShares * (1 - vestingRate)
      const vestedShares = totalShares * (1 - vestingRate);
      
      return {
        time: new Date(time * 1000).toLocaleDateString(),
        timestamp: time,
        vestedShares: vestedShares,
      };
    });
  })();

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
              {/* <a
                href={`${blockExplorerUrl}/address/${vault.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {formatAddress(vault.id)}
              </a> */}
            </div>
            <div className="text-right">
            <button
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-semibold transition-colors cursor-pointer"
              // onClick handler can be replaced by actual deposit logic
              onClick={() => {
                // You may want to replace this with your actual deposit modal trigger or navigation
                alert('Deposit functionality coming soon!');
              }}
            >
              Deposit
            </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAssets.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Invested Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{investedAssets.toFixed(2)}</p>
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

          {/* Pie Charts */}
          <div className="mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Asset Distribution Chart */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Asset Distribution</h2>
                <div className="flex items-center h-64 gap-2">
                  {/* Pie Chart */}
                  <div className="h-full shrink-0" style={{ width: '256px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatNumber((value * 1e18).toString())} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom Legend on the right */}
                  <div className="flex flex-col gap-3 shrink-0">
                    {pieData.map((entry, index) => {
                      const total = pieData.reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? (entry.value / total) * 100 : 0;
                      return (
                        <div key={`legend-${index}`} className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {entry.name}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {percent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Shares Distribution Chart */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Shares Distribution</h2>
                <div className="flex items-center h-64 gap-2">
                  {/* Pie Chart */}
                  <div className="h-full shrink-0" style={{ width: '256px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sharesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sharesData.map((entry, index) => (
                            <Cell key={`cell-shares-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => value.toFixed(2)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom Legend on the right */}
                  <div className="flex flex-col gap-3 shrink-0">
                    {sharesData.map((entry, index) => {
                      const total = sharesData.reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? (entry.value / total) * 100 : 0;
                      return (
                        <div key={`legend-shares-${index}`} className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {entry.name}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {percent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vesting Schedule Chart */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Vesting Schedule</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(vault.vestingStart)} - {formatDate(vault.vestingEnd)}
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vestingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    label={{ value: 'Vested Shares', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => value.toFixed(2)}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="linear" 
                    dataKey="vestedShares" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                    name="Vested Shares"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Positions */}
          {isConnected && userPositions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Positions</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Position ID</th>
                        <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Shares</th>
                        <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Assets</th>
                        <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Shares Unlocked</th>
                        <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Assets Divested</th>
                        <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Divestible Shares</th>
                        <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Vested Shares</th>
                        <th className="text-center py-2.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {userPositions.map((position) => (
                        <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <td className="py-2.5 px-4 text-sm font-medium text-gray-900 dark:text-white">{position.positionId}</td>
                          <td className="py-2.5 px-4 text-sm text-right text-gray-900 dark:text-white">{formatNumber(position.shareAmount, 6)}</td>
                          <td className="py-2.5 px-4 text-sm text-right text-gray-900 dark:text-white">{formatNumber(position.assetAmount, 6)}</td>
                          <td className="py-2.5 px-4 text-sm text-right text-gray-900 dark:text-white">{formatNumber(position.sharesUnlocked, 6)}</td>
                          <td className="py-2.5 px-4 text-sm text-right text-gray-900 dark:text-white">{formatNumber(position.assetsReleased, 6)}</td>
                          <td className="py-2.5 px-4 text-sm text-right text-gray-900 dark:text-white">{(parseFloat(formatNumber(position.shareAmount, 6)) * vestingRate).toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-sm text-right text-gray-900 dark:text-white">{formatNumber("0", 6)}</td>
                          <td className="py-2.5 px-4">
                            <div className="flex gap-2 justify-center">
                              <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium cursor-pointer transition-colors">
                                Divest
                              </button>
                              <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium cursor-pointer transition-colors">
                                Unlock
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

