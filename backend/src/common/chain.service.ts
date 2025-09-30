import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Contract, JsonRpcProvider, Wallet, Interface, ZeroAddress } from 'ethers';
import { appConfig } from './config';
import abi from './abi/arcoinhunt.abi.json';

@Injectable()
export class ChainService {
  private readonly logger = new Logger(ChainService.name);
  private readonly cfg = appConfig();
  private readonly provider = new JsonRpcProvider(this.cfg.rpcUrl, this.cfg.chainId);
  private readonly wallet = new Wallet(this.cfg.adminPrivateKey, this.provider);
  private readonly contract = new Contract(this.cfg.contractAddress, abi as any, this.wallet);
  private readonly iface = new Interface(abi as any);

  getAdminAddress() {
    return this.wallet.address;
  }

  async mintToAdmin(tokenURI: string): Promise<{ tokenId: string; txHash: string }> {
    try {
      const to = this.getAdminAddress();
      const tx = await this.contract.safeMint(to, tokenURI);
      const receipt = await tx.wait();
      const txHash = receipt?.hash || tx.hash;

      // Parse Transfer event (mint)
      let tokenId: string | undefined;
      for (const log of receipt?.logs || []) {
        if (log.address.toLowerCase() !== this.cfg.contractAddress.toLowerCase()) continue;
        try {
          const parsed = this.iface.parseLog(log);
          if (parsed?.name === 'Transfer') {
            const from = parsed.args[0] as string;
            const toAddr = parsed.args[1] as string;
            const id = parsed.args[2].toString();
            if (from.toLowerCase() === ZeroAddress && toAddr.toLowerCase() === to.toLowerCase()) {
              tokenId = id;
              break;
            }
          }
        } catch (_) {}
      }
      if (!tokenId) {
        this.logger.warn('TokenId not found in logs; ensure ABI matches and contract emits Transfer on mint');
        throw new InternalServerErrorException('Mint succeeded but tokenId not found');
      }
      return { tokenId, txHash };
    } catch (e: any) {
      this.logger.error('mintToAdmin failed', e?.shortMessage || e?.message || e);
      throw new InternalServerErrorException(this.mapChainError(e));
    }
  }

  async transferFromAdmin(tokenId: string, toWallet: string): Promise<{ txHash: string }> {
    try {
      const from = this.getAdminAddress();
      const tx = await this.contract['safeTransferFrom(address,address,uint256)'](from, toWallet, tokenId);
      const receipt = await tx.wait();
      const txHash = receipt?.hash || tx.hash;
      return { txHash };
    } catch (e: any) {
      this.logger.error('transferFromAdmin failed', e?.shortMessage || e?.message || e);
      throw new InternalServerErrorException(this.mapChainError(e));
    }
  }

  private mapChainError(e: any): string {
    const m = e?.shortMessage || e?.message || '';
    if (/insufficient funds/i.test(m)) return 'Chain error: insufficient funds for gas';
    if (/nonce/i.test(m)) return 'Chain error: nonce issue';
    if (/gas/i.test(m)) return 'Chain error: gas error';
    return 'Chain error';
  }
}
