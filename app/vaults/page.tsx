'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { MinStakVault } from '@/lib/types';
import { VaultsList } from '@/components/VaultsList';
import { SkeletonVaultList } from '@/components/skeletons/SkeletonVaultList';
import { graphqlClient, GET_STAK_VAULTS } from '@/lib/graphql';

function getVaults(): Promise<MinStakVault[]> {
  return graphqlClient
    .request<{ stakVaults: MinStakVault[] }>(GET_STAK_VAULTS)
    .then(data => data.stakVaults)
}

export default function VaultsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Stak Vaults
          </h1>
          <Link
            href="/vaults/new"
            className="px-6 py-3 bg-dark-primary/30 border border-red hover:bg-dark-primary text-primary font-semibold rounded-lg font-medium transition-colors"
          >
            Launch New Vault
          </Link>
        </div>

        <Suspense fallback={<SkeletonVaultList />}>
          <VaultsList vaultsPromise={getVaults()} />
        </Suspense>
      </main>
    </div>
  );
}
