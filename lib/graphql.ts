import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'https://api.studio.thegraph.com/query/69146/stak-protocol/version/latest';
const API_KEY = 'b7fcac0c276618677075c21d7ad7e496';

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
      totalAssets
      investedAssets
      positionCount
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
      totalAssets
      investedAssets
      positionCount
      createdAt
      updatedAt
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
      owner
      treasury
      performanceRate
      vestingStart
      vestingEnd
      totalAssets
      investedAssets
      totalPerformanceFees
      redeemsAtNavEnabled
      positionCount
      createdAt
      updatedAt
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
      owner
      treasury
      performanceRate
      vestingStart
      vestingEnd
      totalAssets
      investedAssets
      totalPerformanceFees
      redeemsAtNavEnabled
      positionCount
      createdAt
      updatedAt
      positions(first: 100, orderBy: createdAt, orderDirection: desc) {
        id
        positionId
        user
        assetAmount
        shareAmount
        sharesBurned
        sharesUnlocked
        assetsReturned
        assetsReleased
        isClosed
        createdAt
        updatedAt
      }
    }
  }
`;

