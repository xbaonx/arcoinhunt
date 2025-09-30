import { Injectable, BadRequestException, ForbiddenException, TooManyRequestsException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserClaim } from '../../entities/user-claim.entity';
import { Campaign } from '../../entities/campaign.entity';
import { appConfig } from '../../common/config';

@Injectable()
export class ClaimsService {
  private cfg = appConfig();
  constructor(
    @InjectRepository(UserClaim) private claims: Repository<UserClaim>,
  ) {}

  private startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  async countDaily(userId: string) {
    const from = this.startOfDay();
    const r = await this.claims.createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .where('c.user_id = :userId', { userId })
      .andWhere('c.created_at >= :from', { from })
      .getRawOne();
    return Number(r.count || 0);
  }

  async countWeekly(userId: string) {
    const from = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const r = await this.claims.createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .where('c.user_id = :userId', { userId })
      .andWhere('c.created_at >= :from', { from })
      .getRawOne();
    return Number(r.count || 0);
  }

  async distinctLocationsToday(userId: string) {
    const from = this.startOfDay();
    const rows = await this.claims.createQueryBuilder('c')
      .select('COUNT(DISTINCT c.location_id)', 'count')
      .where('c.user_id = :userId', { userId })
      .andWhere('c.created_at >= :from', { from })
      .getRawOne();
    return Number(rows.count || 0);
  }

  async hasClaimAtLocation(userId: string, locationId: string) {
    const exist = await this.claims.findOne({ where: { user_id: userId, location_id: locationId } });
    return !!exist;
  }

  async ensureCaptureEligibility(userId: string, locationId: string, campaign: Campaign) {
    const daily = await this.countDaily(userId);
    if (daily >= this.cfg.dailyQuota) {
      throw new TooManyRequestsException(`Daily quota exceeded (${this.cfg.dailyQuota}/day)`);
    }
    const weekly = await this.countWeekly(userId);
    if (weekly >= this.cfg.weeklyQuota) {
      throw new TooManyRequestsException(`Weekly quota exceeded (${this.cfg.weeklyQuota}/week)`);
    }
    const already = await this.hasClaimAtLocation(userId, locationId);
    if (already) {
      throw new ForbiddenException('Per-location quota reached (1 per location)');
    }
    const max = BigInt(campaign.max_supply);
    const minted = BigInt(campaign.minted);
    if (minted >= max) {
      throw new ForbiddenException('Campaign cap reached');
    }
  }

  async ensureTransferEligibility(userId: string) {
    if (!this.cfg.questEnabled) return;
    const daily = await this.countDaily(userId);
    if (daily >= 2) {
      const distinct = await this.distinctLocationsToday(userId);
      if (distinct < this.cfg.minDistinctLocationsForThirdOfDay) {
        throw new BadRequestException(`Quest rule: need ≥${this.cfg.minDistinctLocationsForThirdOfDay} distinct locations before transferring the 3rd NFT today`);
      }
    }
  }
}
