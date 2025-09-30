import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../../entities/campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(@InjectRepository(Campaign) private repo: Repository<Campaign>) {}

  async getActiveCampaign(): Promise<Campaign | null> {
    const now = new Date();
    return this.repo.createQueryBuilder('c')
      .where('(c.start_at IS NULL OR c.start_at <= :now)', { now })
      .andWhere('(c.end_at IS NULL OR c.end_at >= :now)', { now })
      .orderBy('c.id', 'DESC')
      .getOne();
  }

  async incrementMinted(id: string, manager?: Repository<Campaign>) {
    const r = manager || this.repo;
    await r.createQueryBuilder()
      .update(Campaign)
      .set({ minted: () => 'minted + 1' })
      .where('id = :id', { id })
      .execute();
  }

  async status() {
    const active = await this.getActiveCampaign();
    if (!active) return { active: null };
    return {
      id: active.id,
      name: active.name,
      max_supply: active.max_supply,
      minted: active.minted,
      start_at: active.start_at,
      end_at: active.end_at,
    };
  }
}
