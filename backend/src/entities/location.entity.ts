import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'locations' })
export class Location {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  name!: string | null;

  // Store as WKT point string or lon/lat columns; for PostGIS queries we'll use raw SQL
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  @Index({ spatial: true })
  geom!: string;
}
