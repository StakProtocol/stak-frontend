'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { PositionCard } from '@/components/PositionCard';
import { DepositModal } from '@/components/DepositModal';
import { graphqlClient, GET_STAK_VAULT } from '@/lib/graphql';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAccount } from 'wagmi';
import { formatNumber } from '@/app/utils/helper';

interface StakPosition {
  id: string;
  positionId: string;
  user: string;
  assetAmount: string;
  shareAmount: string;
  sharesUnlocked: string;
  assetsDivested: string;
  isClosed: boolean;
  createdAt: string;
}

interface StakVault {
  id: string;
  asset: string;
  name: string;
  symbol: string;
  decimals: string;
  owner: string;
  treasury: string;
  performanceRate: string;
  vestingStart: string;
  vestingEnd: string;
  redeemsAtNavEnabled: boolean;
  totalPerformanceFees: string;
  totalAssets: string;
  investedAssets: string;
  totalShares: string;
  totalSharesUnlocked: string;
  positionCount: string;
  positions: StakPosition[];
}

const COLORS = ['#1d7a89', '#ec8cab', '#f5b342', '#2fc7a8'];

export default function VaultDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const { address: userAddress, isConnected } = useAccount();
  const [vault, setVault] = useState<StakVault | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

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

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const userPositions = vault?.positions.filter(pos =>
    isConnected && pos.user.toLowerCase() === userAddress?.toLowerCase()
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
        <Navbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-white">Loading vault details...</p>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-white">Vault not found</p>
          <Link href="/vaults" className="mt-4 inline-block text-primary hover:text-primary/70">
            Back to Vaults
          </Link>
        </div>
      </div>
    );
  }

  const totalAssets = formatNumber(vault.totalAssets, vault.decimals) + formatNumber(vault.investedAssets, vault.decimals) - formatNumber(vault.totalPerformanceFees, "4");
  const investedAssets = formatNumber(vault.investedAssets, vault.decimals);
  const totalShares = formatNumber(vault.totalShares, vault.decimals);
  const pricePerShare = totalAssets / totalShares;
  // Calculate utilization rate
  const utilizationRate = totalAssets > 0 ? (investedAssets / totalAssets) * 100 : 0;

  const vestingRate = (parseInt(vault.vestingEnd) - (new Date().getTime() / 1000)) / (parseInt(vault.vestingEnd) - parseInt(vault.vestingStart));
  const sharesVested = totalShares * (1 - vestingRate);

  // Pie chart data
  const pieData = vault ? [
    {
      name: 'Vault Assets',
      value: formatNumber(vault.totalAssets, vault.decimals),
    },
    {
      name: 'Invested Assets',
      value: formatNumber(vault.investedAssets, vault.decimals),
    },
    {
      name: 'Performance Fees',
      value: formatNumber(vault.totalPerformanceFees, "4"),
    },
  ] : [];

  // Shares distribution data
  const sharesData = vault ? (() => {
    // Calculate shares held by vault (locked shares in positions)
    const totalShares = formatNumber(vault.totalShares, vault.decimals);
    const sharesUnlocked = formatNumber(vault.totalSharesUnlocked, vault.decimals);
    const sharesVested = totalShares * (1 - vestingRate);
    const sharesLocked = totalShares - sharesUnlocked - sharesVested;
    // Shares not held by vault (unlocked/released shares)
    

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/vaults" className="text-primary hover:text-primary/70 mb-4 inline-block">
          ← Back to Vaults
        </Link>

        <div className="bg-white dark:bg-primary/40 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">{vault.name}</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">{vault.symbol}</p>
            </div>
            <div className="text-right">
              <button
                className="px-4 py-2 bg-[#FF69B4] hover:bg-[#FF1493] text-white rounded-md text-sm font-semibold transition-colors cursor-pointer"
                onClick={() => setIsDepositModalOpen(true)}
              >
                Deposit
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAssets.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Invested Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{investedAssets.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Utilization Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{utilizationRate.toFixed(2)}%</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Positions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{vault.positionCount}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price Per Share</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pricePerShare.toFixed(2)}</p>
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
                          fill="#135b66"
                          dataKey="value"
                        >
                          {pieData.map((_entry, index) => (
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
                          fill="#135b66"
                          dataKey="value"
                        >
                          {sharesData.map((_, index) => (
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
                    label={{ angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => value.toFixed(2)}
                    labelFormatter={(label) => `Date: ${label}`}
                    labelStyle={{ color: "#000" }}
                  />
                  <Line
                    type="linear"
                    dataKey="vestedShares"
                    stroke="#1d7a89"
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Positions</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {userPositions.length} position{userPositions.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-1 xl:grid-cols-2">
                {userPositions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    vaultDecimals={vault.decimals}
                    vestingRate={vestingRate}
                    pricePerShare={pricePerShare}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Deposit Modal */}
      {vault && (
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          vaultAddress={address as `0x${string}`}
          assetAddress={vault.asset as `0x${string}`}
          assetDecimals={vault.decimals}
          assetSymbol={vault.symbol}
        />
      )}
    </div>
  );
}

