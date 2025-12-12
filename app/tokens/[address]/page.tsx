'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { PurchaseModal } from '@/components/PurchaseModal';
import { ICODivestModal } from '@/components/ICODivestModal';
import { ICOUnlockModal } from '@/components/ICOUnlockModal';
import { graphqlClient, GET_FLYING_ICO } from '@/lib/graphql';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAccount } from 'wagmi';
import { formatNumber } from '@/app/utils/helper';
import { getTokenPicture } from '@/app/utils/logos';

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

interface AcceptedAsset {
  id: string;
  address: string;
  symbol: string;
  decimals: string;
  totalAssets: string;
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
  tokensUnlocked: string;
  totalSupply: string;
  acceptedAssets: AcceptedAsset[];
  positions: FlyingPosition[];
}

const COLORS = ['#1d7a89', '#ec8cab', '#f5b342', '#2fc7a8'];

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const { address: userAddress, isConnected } = useAccount();
  const [ico, setIco] = useState<FlyingICO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [divestModal, setDivestModal] = useState<{ isOpen: boolean; positionId: string; maxTokens: number; assetDecimals: string; assetSymbol: string }>({
    isOpen: false,
    positionId: '',
    maxTokens: 0,
    assetDecimals: '18',
    assetSymbol: '',
  });
  const [unlockModal, setUnlockModal] = useState<{ isOpen: boolean; positionId: string; maxTokens: number; assetDecimals: string; assetSymbol: string }>({
    isOpen: false,
    positionId: '',
    maxTokens: 0,
    assetDecimals: '18',
    assetSymbol: '',
  });

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

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const userPositions = ico?.positions.filter(pos => 
    isConnected && pos.user.toLowerCase() === userAddress?.toLowerCase()
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
        <Navbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-white">Loading ICO details...</p>
        </div>
      </div>
    );
  }

  if (!ico) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-white">ICO not found</p>
          <Link href="/tokens" className="mt-4 inline-block text-primary hover:text-primary/70">
            Back to ICOs
          </Link>
        </div>
      </div>
    );
  }

  const totalSupply = formatNumber(ico.totalSupply);
  const tokensUnlocked = formatNumber(ico.tokensUnlocked);
  const tokensLocked = totalSupply - tokensUnlocked;
  const remaining = formatNumber(ico.tokenCap, "0") - totalSupply;

  // Calculate vesting rate (similar to vaults implementation)
  let vestingRate = 0;
  if (ico) {
    const vestingStart = parseInt(ico.vestingStart);
    const vestingEnd = parseInt(ico.vestingEnd);
    const currentTime = Math.floor(new Date().getTime() / 1000);
    vestingRate = (vestingEnd - currentTime) / (vestingEnd - vestingStart);
    vestingRate = Math.max(0, Math.min(1, vestingRate));
  }

  // Calculate tokens vested (part of tokensLocked that cannot be divested)
  const tokensVested = tokensLocked * (1 - vestingRate);

  // First pie chart: Remaining Cap vs Total Supply
  const supplyPieData = [
    {
      name: 'Remaining Cap',
      value: remaining,
    },
    {
      name: 'Total Supply',
      value: totalSupply,
    },
  ];

  // Second pie chart: Tokens Put vs Tokens Purchased vs Tokens Vested
  const distributionPieData = [
    {
      name: 'Tokens Put',
      value: tokensLocked,
    },
    {
      name: 'Tokens Purchased',
      value: tokensUnlocked,
    },
    {
      name: 'Tokens Vested',
      value: tokensVested,
    },
  ];

  // Vesting schedule data (following vaults implementation)
  const vestingData = ico ? (() => {
    const start = parseInt(ico.vestingStart);
    const end = parseInt(ico.vestingEnd);

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

      // Calculate vesting rate using the formula from vaults
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

      // Calculate vested tokens: tokensLocked * (1 - vestingRate)
      const vestedTokens = tokensLocked * (1 - vestingRate);

      return {
        time: new Date(time * 1000).toLocaleDateString(),
        timestamp: time,
        vestedTokens: vestedTokens,
      };
    });
  })() : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tokens" className="text-primary hover:text-primary/70 mb-4 inline-block">
          ← Back to ICOs
        </Link>

        <div className="bg-white dark:bg-primary/40 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{ico.name}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">{ico.symbol}</p>
            </div>
            <div className="text-right">
              <button
                className="px-4 py-2 bg-[#FF69B4] hover:bg-[#FF1493] text-white rounded-md text-sm font-semibold transition-colors cursor-pointer"
                onClick={() => setIsPurchaseModalOpen(true)}
              >
                Purchase
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Token Cap</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(ico.tokenCap, "0")}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Supply</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(ico.totalSupply).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tokens Per USD</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(ico.tokensPerUsd, "0")}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Positions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{ico.positionCount}</p>
            </div>
          </div>

          {/* Accepted Assets Panel */}
          {ico.acceptedAssets && ico.acceptedAssets.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Backing Assets</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ico.acceptedAssets.map((asset) => {
                  const picturePath = getTokenPicture("sepolia", asset.address);
                  const decimals = asset.decimals ? parseInt(asset.decimals) : 18;
                  const totalAssetsFormatted = formatNumber(asset.totalAssets, decimals.toString());
                  const symbol = asset.symbol || 'UNKNOWN';
                  
                  return (
                    <div
                      key={asset.id}
                      className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="flex-shrink-0">
                        <Image
                          src={picturePath}
                          alt={symbol}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {symbol}
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
                          {totalAssetsFormatted.toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 6 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pie Charts */}
          <div className="mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* First Pie Chart: Remaining Cap vs Total Supply */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Supply Distribution</h2>
                <div className="flex items-center h-64 gap-2">
                  {/* Pie Chart */}
                  <div className="h-full shrink-0" style={{ width: '256px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={supplyPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#135b66"
                          dataKey="value"
                        >
                          {supplyPieData.map((_entry, index) => (
                            <Cell key={`cell-supply-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => value.toFixed(2)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom Legend on the right */}
                  <div className="flex flex-col gap-3 shrink-0">
                    {supplyPieData.map((entry, index) => {
                      const total = supplyPieData.reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? (entry.value / total) * 100 : 0;
                      return (
                        <div key={`legend-supply-${index}`} className="flex items-center gap-3">
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

              {/* Second Pie Chart: Tokens Put vs Tokens Purchased vs Tokens Vested */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Token Distribution</h2>
                <div className="flex items-center h-64 gap-2">
                  {/* Pie Chart */}
                  <div className="h-full shrink-0" style={{ width: '256px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#135b66"
                          dataKey="value"
                        >
                          {distributionPieData.map((_entry, index) => (
                            <Cell key={`cell-distribution-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => value.toFixed(2)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom Legend on the right */}
                  <div className="flex flex-col gap-3 shrink-0">
                    {distributionPieData.map((entry, index) => {
                      const total = distributionPieData.reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? (entry.value / total) * 100 : 0;
                      return (
                        <div key={`legend-distribution-${index}`} className="flex items-center gap-3">
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
                {ico && `${formatDate(ico.vestingStart)} - ${formatDate(ico.vestingEnd)}`}
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
                    dataKey="vestedTokens"
                    stroke="#1d7a89"
                    strokeWidth={2}
                    dot={false}
                    name="Vested Tokens"
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
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {userPositions.map((position) => {
                  const asset = ico?.acceptedAssets.find(a => a.address.toLowerCase() === position.asset.toLowerCase());
                  const assetDecimals = asset?.decimals || "18";
                  const assetSymbol = asset?.symbol || "UNKNOWN";
                  const picturePath = getTokenPicture("sepolia", position.asset);
                  
                  const tokenAmount = formatNumber(position.tokenAmount, assetDecimals);
                  const vestingAmount = formatNumber(position.vestingAmount, assetDecimals);
                  const assetAmount = formatNumber(position.assetAmount, assetDecimals);
                  
                  // Calculate vesting progress for this specific position
                  const positionCreatedAt = parseInt(position.createdAt);
                  const vestingStart = parseInt(ico.vestingStart);
                  const vestingEnd = parseInt(ico.vestingEnd);
                  const currentTime = Math.floor(new Date().getTime() / 1000);
                  
                  // Calculate vesting rate: similar to vaults but for this specific position
                  let positionVestingRate = 0;
                  if (currentTime < vestingStart) {
                    // Before vesting starts: nothing is vested
                    positionVestingRate = 1;
                  } else if (currentTime > vestingEnd) {
                    // After vesting ends: everything is vested
                    positionVestingRate = 0;
                  } else {
                    // During vesting period: calculate based on position creation time
                    // Each position vests from its creation time until vesting end
                    const positionVestingDuration = vestingEnd - Math.max(positionCreatedAt, vestingStart);
                    if (positionVestingDuration > 0) {
                      const timeSinceCreation = currentTime - Math.max(positionCreatedAt, vestingStart);
                      positionVestingRate = Math.max(0, Math.min(1, (positionVestingDuration - timeSinceCreation) / positionVestingDuration));
                    } else {
                      positionVestingRate = 0;
                    }
                  }
                  
                  const vestedTokens = vestingAmount * (1 - positionVestingRate);
                  const divestibleTokens = vestingAmount * positionVestingRate;

                  return (
                    <div key={position.id} className="bg-white dark:bg-dark-primary rounded-xl p-6 transition-all duration-200">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={picturePath}
                            alt={assetSymbol}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Position #{position.positionId}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {assetSymbol}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setDivestModal({
                              isOpen: true,
                              positionId: position.positionId,
                              maxTokens: divestibleTokens,
                              assetDecimals: assetDecimals,
                              assetSymbol: assetSymbol,
                            })}
                            className="px-3 py-1.5 bg-secondary/80 hover:bg-secondary/90 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
                          >
                            Divest
                          </button>
                          <button 
                            onClick={() => setUnlockModal({
                              isOpen: true,
                              positionId: position.positionId,
                              maxTokens: vestingAmount,
                              assetDecimals: assetDecimals,
                              assetSymbol: assetSymbol,
                            })}
                            className="px-3 py-1.5 bg-[#2fc7a8]/80 hover:bg-[#2fc7a8]/90 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
                          >
                            Unlock
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Created: {new Date(parseInt(position.createdAt) * 1000).toLocaleDateString()}
                      </p>

                      {/* Main Stats Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Asset Amount</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {assetAmount.toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Token Amount</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {tokenAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Divestible Tokens</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {divestibleTokens.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vested Tokens</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {vestedTokens.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Vesting Information */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        {/* Vesting Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>Vesting Progress</span>
                            <span>{((1 - positionVestingRate) * 100).toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-primary to-green-800 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(1 - positionVestingRate) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Purchase Modal */}
      {ico && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          icoAddress={address as `0x${string}`}
          acceptedAssets={ico.acceptedAssets}
        />
      )}

      {/* Divest Modal */}
      {ico && (
        <ICODivestModal
          isOpen={divestModal.isOpen}
          onClose={() => setDivestModal({ ...divestModal, isOpen: false })}
          icoAddress={address as `0x${string}`}
          positionId={divestModal.positionId}
          maxTokens={divestModal.maxTokens}
          assetDecimals={divestModal.assetDecimals}
          assetSymbol={divestModal.assetSymbol}
        />
      )}

      {/* Unlock Modal */}
      {ico && (
        <ICOUnlockModal
          isOpen={unlockModal.isOpen}
          onClose={() => setUnlockModal({ ...unlockModal, isOpen: false })}
          icoAddress={address as `0x${string}`}
          positionId={unlockModal.positionId}
          maxTokens={unlockModal.maxTokens}
          assetDecimals={unlockModal.assetDecimals}
          assetSymbol={unlockModal.assetSymbol}
        />
      )}
    </div>
  );
}

