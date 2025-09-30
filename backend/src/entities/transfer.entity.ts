import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'transfers' })
export class Transfer {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  user_id!: string;

  @Column({ type: 'bigint' })
  token_id!: string;

  @Column({ type: 'varchar', length: 128 })
  to_wallet!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  tx_hash!: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;
}
