# Stak Protocol Frontend

A modern web3 application for launching and managing Flying ICOs and Stak Vaults.

## Features

- **Wallet Connection**: Connect using MetaMask, WalletConnect, or injected wallets
- **Flying ICOs**: Launch and manage token offerings with perpetual put options
- **Stak Vaults**: Create and manage yield-generating vaults with performance fees
- **Data Visualization**: Interactive charts showing token distribution, vesting schedules, and utilization rates
- **Position Management**: View and manage your positions in ICOs and vaults
- **Real-time Data**: Fetches data from The Graph indexer

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FACTORY_FLYING_ICO_ADDRESS=0x...
NEXT_PUBLIC_FACTORY_STAK_VAULT_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/xIr38p6GdYSjklWQISOO45i19CREhjna
```

**Note:** The application is configured to run on **Sepolia Testnet** (Chain ID: 11155111). Make sure your wallet is connected to Sepolia testnet when using the application.

### Running the Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Next.js app router pages and layouts
  - `/tokens` - Flying ICO list page
  - `/tokens/[address]` - Flying ICO detail page with charts
  - `/tokens/new` - Create new Flying ICO form
  - `/vaults` - Stak Vault list page
  - `/vaults/[address]` - Stak Vault detail page with charts
  - `/vaults/new` - Create new Stak Vault form
- `/components` - Reusable React components
- `/lib` - Utilities and configurations
  - `graphql.ts` - GraphQL client and queries
  - `wagmi.ts` - Wagmi configuration for wallet connections
- `/app/abis` - Contract ABIs for interactions

## Technologies

- **Next.js 16** - React framework
- **Wagmi** - React Hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **Recharts** - Charting library
- **GraphQL Request** - GraphQL client
- **Tailwind CSS** - Styling

## GraphQL Indexer

The application uses The Graph indexer at:
- Endpoint: `https://api.studio.thegraph.com/query/69146/stak-protocol/version/latest`
- API Key: Configured in `lib/graphql.ts`

