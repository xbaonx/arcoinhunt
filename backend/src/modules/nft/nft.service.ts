import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserClaim } from '../../entities/user-claim.entity';
import { Transfer } from '../../entities/transfer.entity';
import { Campaign } from '../../entities/campaign.entity';
import { Location } from '../../entities/location.entity';
import { IpfsService } from '../../common/ipfs.service';
import { ChainService } from '../../common/chain.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { ClaimsService } from '../claims/claims.service';
import { appConfig } from '../../common/config';
import { randomUUID } from 'crypto';

@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);
  private cfg = appConfig();

  constructor(
    private readonly ds: DataSource,
    @InjectRepository(UserClaim) private claimsRepo: Repository<UserClaim>,
    @InjectRepository(Transfer) private transferRepo: Repository<Transfer>,
    @InjectRepository(Location) private locationRepo: Repository<Location>,
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    private readonly ipfs: IpfsService,
    private readonly chain: ChainService,
    private readonly campaigns: CampaignsService,
    private readonly claimChecks: ClaimsService,
  ) {}

  async ensureNearLocation(locationId: string, lat: number, lng: number, radius: number) {
    const rows = await this.locationRepo.query(
      `SELECT 1 FROM locations l WHERE l.id = $1 AND ST_DWithin(l.geom, ST_MakePoint($2, $3), $4) LIMIT 1`,
      [locationId, lng, lat, radius]
    );
    if (rows.length === 0) throw new ForbiddenException('Not within allowed radius of location');
  }

  async capture(userId: string, locationId: string, lat: number, lng: number, image: Buffer, filename: string, radius = 100) {
    if (!userId || !locationId) throw new BadRequestException('userId, locationId required');
    if (!image || image.length === 0) throw new BadRequestException('image required');

    const campaign = await this.campaigns.getActiveCampaign();
    if (!campaign) throw new ForbiddenException('No active campaign');

    await this.ensureNearLocation(locationId, lat, lng, radius);

    await this.claimChecks.ensureCaptureEligibility(userId, locationId, campaign);

    // Upload preview image to IPFS
    const img = await this.ipfs.uploadImage(image, filename || 'capture.jpg');

    // Build metadata
    const uid = randomUUID();
    const metadata = {
      name: `AR Coin Hunt`,
      description: `AR Coin Hunt collectible minted to admin, transferable on demand.`,
      image: img.url,
      attributes: [
        { trait_type: 'LocationId', value: String(locationId) },
        { trait_type: 'CampaignId', value: String(campaign.id) },
        { trait_type: 'Timestamp', value: new Date().toISOString() },
        { trait_type: 'UID', value: uid },
      ],
    };

    const meta = await this.ipfs.uploadJson(metadata);

    // Mint to admin
    const { tokenId, txHash } = await this.chain.mintToAdmin(meta.url);

    // Persist in one transaction
    await this.ds.transaction(async (manager) => {
      await this.campaigns.incrementMinted(campaign.id, manager.getRepository(Campaign));
      const uc = manager.getRepository(UserClaim).create({
        user_id: userId,
        location_id: locationId,
        campaign_id: campaign.id,
        token_id: tokenId,
        contract: this.cfg.contractAddress,
        chain: this.cfg.chainId === 137 ? 'polygon' : 'polygon-amoy',
        token_uri: meta.url,
        tx_mint: txHash,
        status: 'reserved',
      });
      await manager.getRepository(UserClaim).save(uc);
    });

    const openseaUrl = `${this.cfg.openSeaBase}/${this.cfg.contractAddress}/${tokenId}`;
    return {
      tokenId: Number(tokenId),
      openseaUrl,
      previewImage: img.url,
      tokenURI: meta.url,
    };
  }

  async transfer(userId: string, tokenId: string, userWallet: string) {
    if (!userId || !tokenId || !userWallet) throw new BadRequestException('userId, tokenId, userWallet required');

    const claim = await this.claimsRepo.findOne({ where: { user_id: userId, token_id: tokenId, contract: this.cfg.contractAddress } });
    if (!claim) throw new ForbiddenException('No reserved NFT found for this user/token');
    if (claim.status !== 'reserved') throw new BadRequestException('Token already transferred');

    await this.claimChecks.ensureTransferEligibility(userId);

    const { txHash } = await this.chain.transferFromAdmin(tokenId, userWallet);

    await this.ds.transaction(async (manager) => {
      await manager.getRepository(UserClaim).update({ id: claim.id }, { status: 'transferred' });
      const t = manager.getRepository(Transfer).create({
        user_id: userId,
        token_id: tokenId,
        to_wallet: userWallet,
        tx_hash: txHash,
      });
      await manager.getRepository(Transfer).save(t);
    });

    return { txHash, status: 'transferred' };
  }

  async userNfts(userId: string, status?: 'reserved' | 'transferred') {
    if (!userId) throw new BadRequestException('userId required');
    const qb = this.claimsRepo.createQueryBuilder('c').where('c.user_id = :userId', { userId }).andWhere('c.contract = :addr', { addr: this.cfg.contractAddress });
    if (status) qb.andWhere('c.status = :status', { status });
    const items = await qb.orderBy('c.created_at', 'DESC').getMany();
    return { items };
  }
}
