'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { getBalance, readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { parseUnits, formatUnits, erc20Abi, type Address } from 'viem';
import FlyingICOABI from '@/app/abis/FlyingICO.json';
import { formatNumber } from '@/app/utils/helper';
import { chainByID } from '@/app/utils/chains';
import { getTokenPicture } from '@/app/utils/logos';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface AcceptedAsset {
  id: string;
  address: string;
  symbol: string;
  decimals: string;
  totalAssets: string;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  icoAddress: Address;
  acceptedAssets: AcceptedAsset[];
}

export function PurchaseModal({
  isOpen,
  onClose,
  icoAddress,
  acceptedAssets,
}: PurchaseModalProps) {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const chain = chainByID(chainId);
  const [selectedAssetAddress, setSelectedAssetAddress] = useState<string>('');
  const [investAmount, setInvestAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState<bigint>(BigInt(0));
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [symbol, setSymbol] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isInvesting, setIsInvesting] = useState(false);
  const [step, setStep] = useState<'approve' | 'invest'>('approve');
  const [txStatus, setTxStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  const selectedAsset = acceptedAssets.find(asset => asset.address.toLowerCase() === selectedAssetAddress.toLowerCase());
  const selectedETH = selectedAsset?.address === "0x0000000000000000000000000000000000000000"

  // Load wallet balance and allowance when asset is selected
  useEffect(() => {
    if (!isOpen || !userAddress || !isConnected || !selectedAssetAddress) return;

    async function loadData() {
      try {
        if (!userAddress || !selectedAsset) return;

        let balance;
        let currentAllowance;

        if (selectedETH) {
          let ethBalance = await getBalance(config, { address: userAddress })
          balance = ethBalance.value
          currentAllowance = 0
        } else {
          // Get wallet balance
          balance = await readContract(config, {
            address: selectedAssetAddress as Address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [userAddress],
          });

          // Get allowance
          currentAllowance = await readContract(config, {
            address: selectedAssetAddress as Address,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [userAddress, icoAddress],
          });
        }

        setWalletBalance(balance as bigint);
        setAllowance(currentAllowance as bigint);
        setSymbol(selectedAsset.symbol);
      } catch (error) {
        console.error('Error loading balance/allowance:', error);
      }
    }

    loadData();
  }, [isOpen, userAddress, isConnected, selectedAssetAddress, icoAddress, selectedAsset]);

  // Check if approval is needed
  useEffect(() => {
    if (!investAmount || !selectedAsset) {
      setStep('approve');
      return;
    }

    try {
      const amountBN = parseUnits(investAmount, Number(selectedAsset.decimals));
      if (selectedETH || allowance >= amountBN) {
        setStep('invest');
      } else {
        setStep('approve');
      }
    } catch (error) {
      setStep('approve');
    }
  }, [investAmount, allowance, selectedAsset]);

  const handleApprove = async () => {
    if (!userAddress || !investAmount || !selectedAsset) return;

    setIsApproving(true);
    setTxStatus('Waiting for wallet confirmation...');
    setTxHash('');

    try {
      const amountBN = parseUnits(investAmount, Number(selectedAsset.decimals));

      toast.loading('Please confirm the approval transaction in your wallet', { id: 'approve' });

      const hash = await writeContract(config, {
        address: selectedAssetAddress as Address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [icoAddress, amountBN],
      });

      setTxHash(hash);
      setTxStatus('Transaction submitted. Waiting for confirmation...');
      toast.loading('Transaction submitted. Waiting for confirmation...', { id: 'approve' });

      const receipt = await waitForTransactionReceipt(config, { hash });

      setTxStatus('Transaction confirmed!');
      toast.success('Approval successful!', { id: 'approve' });

      // Update allowance after approval
      const newAllowance = await readContract(config, {
        address: selectedAssetAddress as Address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, icoAddress],
      });
      setAllowance(newAllowance as bigint);
      setStep('invest');
      setTxStatus('');
      setTxHash('');
    } catch (error: any) {
      console.error('Approval error:', error);
      const errorMessage = error?.message?.includes('User rejected')
        ? 'Approval cancelled'
        : 'Approval failed. Please try again.';
      toast.error(errorMessage, { id: 'approve' });
      setTxStatus('');
      setTxHash('');
    } finally {
      setIsApproving(false);
    }
  };

  const handleInvest = async () => {
    if (!userAddress || !investAmount || !selectedAsset) return;

    setIsInvesting(true);
    setTxStatus('Waiting for wallet confirmation...');
    setTxHash('');

    try {
      const amountBN = parseUnits(investAmount, Number(selectedAsset.decimals));

      toast.loading('Please confirm the investment transaction in your wallet', { id: 'invest' });
      let hash;

      if (selectedETH) {
        hash = await writeContract(config, {
          address: icoAddress,
          abi: FlyingICOABI,
          functionName: 'investEther',
          args: [],
          value: amountBN
        })
      } else {
        hash = await writeContract(config, {
          address: icoAddress,
          abi: FlyingICOABI,
          functionName: 'investERC20',
          args: [selectedAssetAddress as Address, amountBN],
        });
      }

      setTxHash(hash);
      setTxStatus('Transaction submitted. Waiting for confirmation...');
      toast.loading('Transaction submitted. Waiting for confirmation...', { id: 'invest' });

      const receipt = await waitForTransactionReceipt(config, { hash });

      setTxStatus('Transaction confirmed!');
      toast.success('Investment successful!', { id: 'invest' });

      // Wait a moment before closing to show success
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset and close
      setInvestAmount('');
      setTxStatus('');
      setTxHash('');
      onClose();
      // Reload page data
      window.location.reload();
    } catch (error: any) {
      console.error('Investment error:', error);
      const errorMessage = error?.message?.includes('User rejected')
        ? 'Investment cancelled'
        : 'Investment failed. Please try again.';
      toast.error(errorMessage, { id: 'invest' });
      setTxStatus('');
      setTxHash('');
    } finally {
      setIsInvesting(false);
    }
  };

  const handleMax = () => {
    if (walletBalance > 0 && selectedAsset) {
      const balanceFormatted = formatUnits(walletBalance, Number(selectedAsset.decimals));
      setInvestAmount(balanceFormatted);
    }
  };

  // Auto-select first asset if none selected
  useEffect(() => {
    if (isOpen && !selectedAssetAddress && acceptedAssets.length > 0) {
      setSelectedAssetAddress(acceptedAssets[0].address);
    }
  }, [isOpen, selectedAssetAddress, acceptedAssets]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInvestAmount('');
      setSelectedAssetAddress('');
      setWalletBalance(BigInt(0));
      setAllowance(BigInt(0));
      setSymbol('');
      setStep('approve');
      setTxStatus('');
      setTxHash('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const balanceFormatted = selectedAsset ? formatNumber(walletBalance.toString(), selectedAsset.decimals) : 0;
  const allowanceFormatted = selectedAsset ? formatNumber(allowance.toString(), selectedAsset.decimals) : 0;
  const needsApproval = !selectedETH && selectedAsset && investAmount && parseUnits(investAmount || '0', Number(selectedAsset.decimals)) > allowance;

  const isValidAmount = () => {
    if (!investAmount || !selectedAsset) return false;
    try {
      const amount = parseFloat(investAmount);
      const amountBN = parseUnits(investAmount, Number(selectedAsset.decimals));
      return amount > 0 && amountBN <= walletBalance;
    } catch {
      return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-dark-primary rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Tokens</h2>
          <button
            onClick={onClose}
            disabled={isApproving || isInvesting}
            className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        {/* Asset Selection Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Asset
          </label>
          <div className="relative">
            <select
              value={selectedAssetAddress}
              onChange={(e) => setSelectedAssetAddress(e.target.value)}
              disabled={isApproving || isInvesting}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-10"
            >
              {acceptedAssets.map((asset) => (
                <option key={asset.id} value={asset.address}>
                  {asset.symbol} ({asset.address.slice(0, 6)}...{asset.address.slice(-4)})
                </option>
              ))}
            </select>
            {selectedAsset && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Image
                  src={getTokenPicture("sepolia", selectedAsset.address)}
                  alt={selectedAsset.symbol}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Wallet Balance and Allowance Display */}
        {selectedAsset && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Wallet Balance:</span>
                <span className="font-medium text-gray-900 dark:text-white">{balanceFormatted.toFixed(2)} {symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Approved Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">{allowanceFormatted.toFixed(2)} {symbol}</span>
              </div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              disabled={isApproving || isInvesting || !selectedAsset}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleMax}
              disabled={isApproving || isInvesting || !selectedAsset || walletBalance === BigInt(0)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              MAX
            </button>
          </div>
          {investAmount && selectedAsset && !isValidAmount() && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Amount must be greater than 0 and not exceed wallet balance
            </p>
          )}
        </div>

        {/* Steps */}
        {selectedAsset && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex-1 text-center py-2 ${step === 'approve' ? 'bg-primary/20 text-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-lg transition-colors`}>
                <span className="font-medium">1. Approve</span>
              </div>
              <div className="w-4 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
              <div className={`flex-1 text-center py-2 ${step === 'invest' ? 'bg-primary/20 text-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-lg transition-colors`}>
                <span className="font-medium">2. Invest</span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {(isApproving || isInvesting || txStatus) && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {txStatus || (isApproving ? 'Processing approval...' : 'Processing investment...')}
                </p>
                {txHash && (
                  <div className="mt-1">
                    <a
                      href={`${chain.blockExplorerUrl}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono"
                    >
                      View on Explorer: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={!isValidAmount() || isApproving}
              className="flex-1 px-4 py-3 bg-primary/20 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isApproving ? 'Approving...' : 'Approve'}
            </button>
          ) : (
            <button
              onClick={handleInvest}
              disabled={!isValidAmount() || isInvesting}
              className="flex-1 px-4 py-3 bg-primary/60 hover:bg-primary/80 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isInvesting ? 'Investing...' : 'Invest'}
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isApproving || isInvesting}
            className="px-4 py-3 cursor-pointer bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
