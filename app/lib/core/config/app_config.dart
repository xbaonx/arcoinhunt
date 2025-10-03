class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://arcoinhunt.onrender.com',
  );
  static const defaultChainId = int.fromEnvironment('CHAIN_ID', defaultValue: 80002);
  static const contractAddress = String.fromEnvironment('CONTRACT_ADDRESS', defaultValue: '');
  static const openSeaBase = 'https://opensea.io/assets/matic';
}
