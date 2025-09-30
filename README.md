# AR Coin Hunt — Polygon NFT (Admin-Mint, Transfer on demand)

Monorepo containing:
- contracts/: Solidity ERC-721 (OpenZeppelin), Hardhat, deploy to Polygon Amoy/Mainnet
- backend/: NestJS + PostgreSQL (PostGIS) + ethers.js + IPFS (Pinata/Infura)
- app/: Flutter (AR via ar_flutter_plugin) with Clean Architecture + BLoC + GetIt

Core flow:
1) User goes to a real-world location → opens AR → sees 3D coin → captures a photo
2) App POST /ar/capture → Backend uploads image to IPFS, builds metadata, mints NFT to admin wallet (safeMint(admin, tokenURI))
3) Backend returns { tokenId, openseaUrl, previewImage, tokenURI }
4) App shows "Transfer to my wallet" → POST /nft/transfer → Backend checks quotas & quest rules → safeTransferFrom(admin → userWallet)

See individual READMEs:
- contracts/README.md
- backend/README.md
- app/README.md
