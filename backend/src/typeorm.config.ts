import { DataSource } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { Location } from './entities/location.entity';
import { Transfer } from './entities/transfer.entity';
import { UserClaim } from './entities/user-claim.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  entities: [Location, Campaign, UserClaim, Transfer],
  migrations: ['src/migrations/*.ts'],
});
