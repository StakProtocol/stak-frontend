'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { graphqlClient, GET_STAK_VAULT } from '@/lib/graphql';
import { StakVault } from '@/lib/types';
import { Vault } from '@/components/Vault';
import { SkeletonVault } from '@/components/skeletons/SkeletonVault';

function getVault(address: string): Promise<StakVault> {
  return graphqlClient
    .request<{ stakVault: StakVault }>(GET_STAK_VAULT, { id: address.toLowerCase() })
    .then(data => data.stakVault)
}

export default function Page() {
  const params = useParams();
  const address = params.address as string;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-primary dark:to-black">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/vaults" className="text-primary hover:text-primary/70 mb-4 inline-block">
          ← Back to Vaults
        </Link>

        <Suspense fallback={<SkeletonVault />}>
          <Vault vaultPromise={getVault(address)} vaultAddress={address} />
        </Suspense>
      </main>
    </div>
  );
}
