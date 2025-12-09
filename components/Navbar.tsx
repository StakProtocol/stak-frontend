'use client';

import Link from 'next/link';
import { WalletButton } from './WalletButton';
import { useChainId } from 'wagmi';

export function Navbar() {
  const chainId = useChainId();

  return (
    <nav className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              Stak Protocol
            </Link>
            <div className="hidden md:flex gap-6">
              <Link
                href="/tokens"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Flying ICOs
              </Link>
              <Link
                href="/vaults"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Stak Vaults
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {chainId === 11155111 && (
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs font-medium rounded-full">
                Sepolia Testnet
              </span>
            )}
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

