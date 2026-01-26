export interface MinStakVault {
  id: string;
  asset: string;
  name: string;
  symbol: string;
  decimals: string;
  totalAssets: string;
  totalSupply: string;
  investedAssets: string;
  redeemsAtNavEnabled: boolean;
  totalPerformanceFees: string;
  positionCount: string;
}

export interface StakPosition {
  id: string;
  positionId: string;
  user: string;
  assetAmount: string;
  shareAmount: string;
  sharesUnlocked: string;
  assetsDivested: string;
  vestingAmount: string;
  initialAssets: string;
  isClosed: boolean;
  createdAt: string;
}

export interface StakVault {
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
  redeemableAssets: string;
  totalSupply: string;
  totalShares: string;
  divestFee: string;
  positionCount: string;
  positions: StakPosition[];
}