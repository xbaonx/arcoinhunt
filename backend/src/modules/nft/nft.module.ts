import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { UserClaim } from '../../entities/user-claim.entity';
import { Transfer } from '../../entities/transfer.entity';
import { Campaign } from '../../entities/campaign.entity';
import { Location } from '../../entities/location.entity';
import { ClaimsModule } from '../claims/claims.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { IpfsService } from '../../common/ipfs.service';
import { ChainService } from '../../common/chain.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserClaim, Transfer, Campaign, Location]),
    ClaimsModule,
    CampaignsModule,
  ],
  controllers: [NftController],
  providers: [NftService, IpfsService, ChainService],
})
export class NftModule {}
