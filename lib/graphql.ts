import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '';
const API_KEY = process.env.NEXT_PUBLIC_GRAPHQL_API_KEY || '';

export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: API_KEY ? {
    'Authorization': `Bearer ${API_KEY}`,
  } : {},
});

// GraphQL Queries
export const GET_FLYING_ICOS = `
  query GetFlyingICOs {
    flyingICOs(first: 100, orderBy: createdAt, orderDirection: desc) {
      id
      name
      symbol
      treasury
      vestingStart
      vestingEnd
      tokenCap
      tokensPerUsd
      investedAssets
      positionCount
      totalSupply
      tokensUnlocked
      assets {
        id
        symbol
        decimals
        totalAssets
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_FLYING_ICO = `
  query GetFlyingICO($id: ID!) {
    flyingICO(id: $id) {
      id
      name
      symbol
      treasury
      vestingStart
      vestingEnd
      tokenCap
      tokensPerUsd
      investedAssets
      positionCount
      totalSupply
      tokensUnlocked
      createdAt
      updatedAt
      assets {
        id
        symbol
        decimals
        totalAssets
      }
      positions(first: 100, orderBy: createdAt, orderDirection: desc) {
        id
        positionId
        user
        assetAmount
        tokenAmount
        vestingAmount
        asset
        isClosed
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_STAK_VAULTS = `
  query GetStakVaults {
    stakVaults(first: 100, orderBy: createdAt, orderDirection: desc) {
      id
      asset
      name
      symbol
      decimals
      totalAssets
      investedAssets
      totalPerformanceFees
      redeemsAtNavEnabled
      positionCount
    }
  }
`;

export const GET_STAK_VAULT = `
  query GetStakVault($id: ID!) {
    stakVault(id: $id) {
      id
      asset
      name
      symbol
      decimals
      owner
      treasury
      performanceRate
      vestingStart
      vestingEnd
      redeemsAtNavEnabled
      totalPerformanceFees
      totalAssets
      investedAssets
      totalShares
      totalSupply
      positionCount
      createdAt
      updatedAt
      positions(first: 100, orderBy: createdAt, orderDirection: desc) {
        id
        positionId
        user
        assetAmount
        shareAmount
        sharesUnlocked
        assetsDivested
        vestingAmount
        initialAssets
        isClosed
        createdAt
        updatedAt
      }
    }
  }
`;
