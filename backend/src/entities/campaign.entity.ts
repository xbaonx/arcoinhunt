import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'campaigns' })
export class Campaign {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ type: 'bigint' })
  max_supply!: string;

  @Column({ type: 'bigint', default: '0' })
  minted!: string;

  @Column({ type: 'timestamptz', nullable: true })
  start_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  end_at!: Date | null;
}
