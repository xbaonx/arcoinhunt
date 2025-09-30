export const appConfig = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8080),
  // DB via DATABASE_URL in TypeORM config
  // Chain
  rpcUrl: process.env.RPC_URL!,
  chainId: Number(process.env.CHAIN_ID || '80002'),
  adminPrivateKey: process.env.ADMIN_PRIVATE_KEY!,
  contractAddress: process.env.CONTRACT_ADDRESS!,
  // IPFS
  ipfsProvider: (process.env.IPFS_PROVIDER || 'pinata') as 'pinata' | 'infura',
  ipfsKey: process.env.IPFS_KEY!,
  ipfsSecret: process.env.IPFS_SECRET!,
  // Business rules
  dailyQuota: Number(process.env.DAILY_QUOTA || '3'),
  weeklyQuota: Number(process.env.WEEKLY_QUOTA || '10'),
  questEnabled: (process.env.QUEST_ENABLED || 'true') === 'true',
  minDistinctLocationsForThirdOfDay: Number(process.env.MIN_DISTINCT_LOCATIONS_FOR_THIRD_OF_DAY || '2'),
  // Misc
  openSeaBase: 'https://opensea.io/assets/matic',
});
