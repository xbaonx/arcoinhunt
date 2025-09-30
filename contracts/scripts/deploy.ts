import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const admin = process.env.ADMIN_ADDRESS;
  const name = process.env.NFT_NAME || "AR Coin Hunt";
  const symbol = process.env.NFT_SYMBOL || "ARCH";

  if (!admin) throw new Error("Missing ADMIN_ADDRESS in env");

  console.log("Deploying with admin:", admin);

  const Factory = await ethers.getContractFactory("ARCoinHunt");
  const contract = await Factory.deploy(admin, name, symbol);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("ARCoinHunt deployed:", address);

  // Optional verify hint
  console.log("Verify:");
  console.log(
    `npx hardhat verify --network ${process.env.CHAIN_ID === "137" ? "polygon" : "amoy"} ${address} ${admin} "${name}" "${symbol}"`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
