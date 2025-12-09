Work on this Next.js app. It should be styled as a modern web3 application.

Make a plan and then implement the following description:

It must be an entire application, without missing parts.

It must have a connect button that connects a wallet, using the most used library for connecting to web3.

In the main page "/" I want to display 2 panels. "Flying ICO" and "Stak Vault". The main slogan of this page can be something about "launch".

The "FlyingICO" panel will take you to the /ico page that will contain a list of FlyingICO contracts deployed with the FactoryFlyingICO.
The "StakVault" panel will take you to the /vaults page that will contain a list of Vaults contracts deployed with the FactoryStakVault.

The lists of icos or vaults will display name, symbol and other information that can be relevant for each item. Clicking on one of them will take you to /ico/[address] or /vault/[address] where address is the address of the deployed contract.

Each page will have a "launch" button that will take you to /ico/new or /vault/new page that will contain forms. The form fields can be obtained by analyzing the Factory files in the abis folder.

In the /ico/[address] or /vault/[address] the information that can be displayed will come from indexers. Also, the ABIs folder contains json files where information about what can be displayed is available. Try to display as much as you can.

One idea that I have is for a FlyingICO contract address display a pie chart with totalSupply, tokensLocked in perpetual put, tokens purchased. Also to display a graph with the vesting schedule times and amount of tokens locked by that schedule.

Also, if the user has its wallet connected, a button to purchase the perpetual put with one of the tokens that the ICO accepts. You can display the positions that he holds, and per position buttons to divest or withdraw.

Also we can diplay Utilization Rate.
Also we can display BackingAssets vs Contract Balances per asset that the token holds.

Try to apply the same ideas to the StakVault, considering that it has its own other parameters and information.
Propose ideas.

Data can be obtained using an indexers.

Pages:
- root: display a form to create vaults (see app/abis/factory.json)
- /vaults: list of StakVault
- /tokens: list of FlyingICO
- /vaults/[address]: details for vault and positions
- /tokens/[address]: details for token and positions

We have an indexer for StakVault and FactoryStakVault with the next schema:
```
type Factory @entity(immutable: false) {
  id: ID!
  vaultCount: BigInt!
  vaults: [StakVault!]! @derivedFrom(field: "factory")
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}

type StakVault @entity(immutable: false) {
  id: ID!
  factory: Factory!

  # From Initialized
  asset: Bytes!
  name: String!
  symbol: String!
  owner: Bytes!
  treasury: Bytes!
  performanceRate: BigInt!
  vestingStart: BigInt!
  vestingEnd: BigInt!

  # State counters
  totalAssets: BigInt!
  investedAssets: BigInt!
  totalPerformanceFees: BigInt!
  redeemsAtNavEnabled: Boolean!

  # Positions
  positions: [Position!]! @derivedFrom(field: "vault")
  positionCount: BigInt!

  # Metadata
  createdAt: BigInt!
  updatedAt: BigInt!
}

type Position @entity(immutable: false) {
  id: ID!
  vault: StakVault!
  positionId: BigInt!
  user: Bytes!

  # Initial amounts
  assetAmount: BigInt!
  shareAmount: BigInt!

  # Dynamic state
  sharesBurned: BigInt!
  sharesUnlocked: BigInt!
  assetsReturned: BigInt!
  assetsReleased: BigInt!

  # Status
  isClosed: Boolean!

  # Metadata
  createdAt: BigInt!
  updatedAt: BigInt!
}
```

We have an indexer for FlyingICO and FactoryFlyingICO with the next schema:
```
# StakVaults
type FactoryStakVault @entity(immutable: false) {
  id: ID!
  vaultCount: BigInt!
  vaults: [StakVault!]! @derivedFrom(field: "factory")
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}

type StakVault @entity(immutable: false) {
  id: ID!
  factory: FactoryStakVault!

  # From Initialized
  asset: Bytes!
  name: String!
  symbol: String!
  owner: Bytes!
  treasury: Bytes!
  performanceRate: BigInt!
  vestingStart: BigInt!
  vestingEnd: BigInt!

  # State counters
  totalAssets: BigInt!
  investedAssets: BigInt!
  totalPerformanceFees: BigInt!
  redeemsAtNavEnabled: Boolean!

  # Positions
  positions: [StakPosition!]! @derivedFrom(field: "vault")
  positionCount: BigInt!

  # Metadata
  createdAt: BigInt!
  updatedAt: BigInt!
}

type StakPosition @entity(immutable: false) {
  id: ID!
  vault: StakVault!
  positionId: BigInt!
  user: Bytes!

  # Initial amounts
  assetAmount: BigInt!
  shareAmount: BigInt!

  # Dynamic state
  sharesBurned: BigInt!
  sharesUnlocked: BigInt!
  assetsReturned: BigInt!
  assetsReleased: BigInt!

  # Status
  isClosed: Boolean!

  # Metadata
  createdAt: BigInt!
  updatedAt: BigInt!
}

# FlyingICO
type FactoryFlyingICO @entity(immutable: false) {
  id: ID!
  tokenCount: BigInt!
  tokens: [FlyingICO!]! @derivedFrom(field: "factory")
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}

type FlyingICO @entity(immutable: false) {
  id: ID!
  factory: FactoryFlyingICO!

  name: String!
  symbol: String!
  treasury: Bytes!
  vestingStart: BigInt!
  vestingEnd: BigInt!
  tokenCap: BigInt!
  tokensPerUsd: BigInt!

  # State counters
  totalAssets: BigInt!
  investedAssets: BigInt!

  # Positions
  positions: [FlyingPosition!]! @derivedFrom(field: "token")
  positionCount: BigInt!

  # Metadata
  createdAt: BigInt!
  updatedAt: BigInt!
}

type FlyingPosition @entity(immutable: false) {
  id: ID!
  token: FlyingICO!
  positionId: BigInt!
  user: Bytes!

  assetAmount: BigInt!
  tokenAmount: BigInt!
  vestingAmount: BigInt!
  asset: Bytes!

  # Status
  isClosed: Boolean!

  # Metadata
  createdAt: BigInt!
  updatedAt: BigInt!
}
```

The URL of the indexer is a GraphQL endpoint here:
https://api.studio.thegraph.com/query/69146/stak-protocol/version/latest
if the api needs an api key, use b7fcac0c276618677075c21d7ad7e496
