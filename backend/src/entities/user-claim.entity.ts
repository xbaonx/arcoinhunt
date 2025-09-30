import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'user_claims' })
@Unique(['user_id', 'location_id'])
@Index('idx_user_claims_user_date', ['user_id', 'created_at'])
export class UserClaim {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  user_id!: string;

  @Column({ type: 'bigint' })
  location_id!: string;

  @Column({ type: 'bigint' })
  campaign_id!: string;

  @Column({ type: 'bigint', nullable: true })
  token_id!: string | null;

  @Column({ type: 'varchar', length: 64 })
  contract!: string;

  @Column({ type: 'varchar', length: 16, default: 'polygon' })
  chain!: string;

  @Column({ type: 'text', nullable: true })
  token_uri!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  tx_mint!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'reserved' })
  status!: 'reserved' | 'transferred' | string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;
}
