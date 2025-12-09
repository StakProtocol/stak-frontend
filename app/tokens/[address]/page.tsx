'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { graphqlClient, GET_FLYING_ICO } from '@/lib/graphql';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAccount } from 'wagmi';
import { readContract, writeContract, waitForTransaction } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { parseEther, formatEther } from 'viem';
import FlyingICOABI from '@/app/abis/FlyingICO.json';

interface FlyingPosition {
  id: string;
  positionId: string;
  user: string;
  assetAmount: string;
  tokenAmount: string;
  vestingAmount: string;
  asset: string;
  isClosed: boolean;
  createdAt: string;
}

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
  positions: FlyingPosition[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const { address: userAddress, isConnected } = useAccount();
  const [ico, setIco] = useState<FlyingICO | null>(null);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [investing, setInvesting] = useState(false);

  useEffect(() => {
    async function fetchICO() {
      try {
        const data = await graphqlClient.request<{ flyingICO: FlyingICO }>(GET_FLYING_ICO, { id: address.toLowerCase() });
        setIco(data.flyingICO);
      } catch (error) {
        console.error('Error fetching ICO:', error);
      } finally {
        setLoading(false);
      }
    }
    if (address) {
      fetchICO();
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

  // Calculate chart data
  const pieData = ico ? [
    {
      name: 'Total Supply',
      value: parseFloat(ico.tokenCap) / 1e18,
    },
    {
      name: 'Tokens Locked',
      value: ico.positions.reduce((sum, pos) => sum + parseFloat(pos.vestingAmount) / 1e18, 0),
    },
    {
      name: 'Tokens Purchased',
      value: ico.positions.reduce((sum, pos) => sum + parseFloat(pos.tokenAmount) / 1e18, 0),
    },
  ] : [];

  // Vesting schedule data
  const vestingData = ico ? (() => {
    const start = parseInt(ico.vestingStart);
    const end = parseInt(ico.vestingEnd);
    const duration = end - start;
    const steps = 10;
    const step = duration / steps;
    
    return Array.from({ length: steps + 1 }, (_, i) => {
      const time = start + step * i;
      const progress = (time - start) / duration;
      const unlocked = ico.positions.reduce((sum, pos) => {
        const vestingProgress = Math.min(1, Math.max(0, (time - parseInt(pos.createdAt)) / (end - parseInt(pos.createdAt))));
        return sum + (parseFloat(pos.vestingAmount) / 1e18) * vestingProgress;
      }, 0);
      
      return {
        time: formatDate(time.toString()),
        unlocked,
        locked: ico.positions.reduce((sum, pos) => sum + parseFloat(pos.vestingAmount) / 1e18, 0) - unlocked,
      };
    });
  })() : [];

  const userPositions = ico?.positions.filter(pos => 
    isConnected && pos.user.toLowerCase() === userAddress?.toLowerCase()
  ) || [];

  const handleInvest = async () => {
    if (!isConnected || !selectedAsset || !investAmount) return;
    
    setInvesting(true);
    try {
      // This is a placeholder - you'll need to implement the actual contract interaction
      // based on your contract addresses and network
      console.log('Investing:', { address, asset: selectedAsset, amount: investAmount });
      // const hash = await writeContract(config, {
      //   address: address as `0x${string}`,
      //   abi: FlyingICOABI,
      //   functionName: 'investERC20',
      //   args: [selectedAsset, parseEther(investAmount)],
      // });
      // await waitForTransaction(config, { hash });
      alert('Investment functionality needs contract addresses configured');
    } catch (error) {
      console.error('Investment error:', error);
      alert('Investment failed');
    } finally {
      setInvesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <Navbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading ICO details...</p>
        </div>
      </div>
    );
  }

  if (!ico) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">ICO not found</p>
          <Link href="/tokens" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Back to ICOs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tokens" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to ICOs
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{ico.name}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">{ico.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Contract</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{formatAddress(ico.id)}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Token Cap</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(ico.tokenCap)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(ico.totalAssets)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Positions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{ico.positionCount}</p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Token Distribution</h2>
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
                  <Line type="monotone" dataKey="unlocked" stroke="#3b82f6" name="Unlocked" />
                  <Line type="monotone" dataKey="locked" stroke="#8b5cf6" name="Locked" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Investment Section */}
          {isConnected && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Purchase Perpetual Put</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Asset
                  </label>
                  <input
                    type="text"
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleInvest}
                    disabled={investing || !selectedAsset || !investAmount}
                    className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {investing ? 'Investing...' : 'Invest'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Positions */}
          {isConnected && userPositions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Positions</h2>
              <div className="space-y-4">
                {userPositions.map((position) => (
                  <div key={position.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Position ID</p>
                        <p className="font-medium text-gray-900 dark:text-white">{position.positionId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Token Amount</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatNumber(position.tokenAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Vesting Amount</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatNumber(position.vestingAmount)}</p>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Asset</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Token Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Vesting</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ico.positions.map((position) => (
                    <tr key={position.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-4 text-sm font-mono text-gray-900 dark:text-white">
                        {formatAddress(position.user)}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-900 dark:text-white">
                        {formatAddress(position.asset)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                        {formatNumber(position.tokenAmount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                        {formatNumber(position.vestingAmount)}
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

