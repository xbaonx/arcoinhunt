# Contracts — AR Coin Hunt (Polygon)

Solidity ERC-721 using OpenZeppelin v5, admin-only mint. NFTs are minted to admin wallet and later transferred on demand.

## Files
- `contracts/ARCoinHunt.sol`
- `scripts/deploy.ts`
- `hardhat.config.ts`

## Install
```bash
npm i
```

## Configure
Copy `.env.example` → `.env` and fill:
- `PRIVATE_KEY` (deployer = owner)
- `ADMIN_ADDRESS` (owner address)
- `RPC_URL` (Polygon Amoy or Mainnet)
- `CHAIN_ID` (80002 Amoy, 137 Mainnet)
- `POLYGONSCAN_API_KEY` (optional verify)

## Build & Deploy
```bash
npm run build
npm run deploy:amoy   # or deploy:mainnet
```

## Acceptance
- `owner()` = admin wallet (deployer passed as `initialOwner`)
- `safeMint(admin, tokenURI)` mints and returns `tokenId` (from backend via receipt Transfer event or return value)
- `safeTransferFrom(admin, user, tokenId)` works

## Notes
- BaseURI can be set via `setBaseURI()` if you use gateway-based URIs.
- Metadata should follow ERC-721 standard with image and attributes.
