import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

import { HealthController } from './modules/health/health.controller';
import { Location } from './entities/location.entity';
import { Campaign } from './entities/campaign.entity';
import { UserClaim } from './entities/user-claim.entity';
import { Transfer } from './entities/transfer.entity';
import { LocationsModule } from './modules/locations/locations.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { NftModule } from './modules/nft/nft.module';
import { HttpErrorFilter } from './common/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        entities: [Location, Campaign, UserClaim, Transfer],
        synchronize: false,
        migrations: ['dist/migrations/*.js'],
      }),
    }),
    LocationsModule,
    CampaignsModule,
    ClaimsModule,
    NftModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpErrorFilter },
  ],
})
export class AppModule {}
