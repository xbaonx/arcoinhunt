# AR Coin Hunt Backend (NestJS + Postgres + PostGIS + ethers.js)

Implements:
- GET `/health`
- GET `/coins/nearby?lat&lng&radius=100&userId=`
- GET `/campaign/status`
- POST `/ar/capture` (multipart: `image`; fields: `userId, lat, lng, locationId`)
- POST `/nft/transfer` (JSON: `userId, tokenId, userWallet`)
- GET `/user/nfts?userId=...&status=reserved|transferred`

Admin-mints to admin wallet, transfers to user only on demand with quotas and quest rule.

## Setup
```bash
cd backend
npm i
cp .env.example .env
# set DATABASE_URL, RPC_URL, CHAIN_ID, ADMIN_PRIVATE_KEY, CONTRACT_ADDRESS, IPFS_* keys
```

### Database
- Create a PostgreSQL database with PostGIS enabled
- Run migrations:
```bash
npm run build
npm run migration:run
```

### Seed sample data
```bash
npm run seed
```
This inserts 5–10 sample locations and one campaign.

### Run
```bash
npm run start
# open http://localhost:8080/docs
```

## Render.com Deployment
- Create a Web Service from this folder (Node 18+)
- Create a Managed Postgres and enable PostGIS (Run: `CREATE EXTENSION IF NOT EXISTS postgis;`)
- Set environment variables from `.env.example`
- Build Command: `npm run build`
- Start Command: `npm run start`
- Health check path: `/health`
- Run `npm run migration:run` once (Shell tab) after deploy

## Notes
- Rate limiting enabled globally; specific throttles on `/ar/capture` and `/nft/transfer`
- IPFS supports Pinata or Infura
- Chain errors are mapped to readable messages (insufficient funds, nonce, gas)
- All mint/transfer logs are stored in DB
