import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1700000000000 implements MigrationInterface {
    name = 'Init1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
        await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS locations (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(128),
          geom GEOGRAPHY(POINT, 4326) NOT NULL
        );`);
        await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          max_supply BIGINT NOT NULL,
          minted BIGINT NOT NULL DEFAULT 0,
          start_at TIMESTAMPTZ,
          end_at TIMESTAMPTZ
        );`);
        await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS user_claims (
          id BIGSERIAL PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          location_id BIGINT NOT NULL,
          campaign_id BIGINT NOT NULL,
          token_id BIGINT,
          contract VARCHAR(64) NOT NULL,
          chain VARCHAR(16) NOT NULL DEFAULT 'polygon',
          token_uri TEXT,
          tx_mint VARCHAR(80),
          status VARCHAR(16) NOT NULL DEFAULT 'reserved',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT uq_user_loc UNIQUE(user_id, location_id)
        );`);
        await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS transfers (
          id BIGSERIAL PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          token_id BIGINT NOT NULL,
          to_wallet VARCHAR(128) NOT NULL,
          tx_hash VARCHAR(80),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_claims_user_date ON user_claims (user_id, created_at);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_locations_geom;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_claims_user_date;`);
        await queryRunner.query(`DROP TABLE IF EXISTS transfers;`);
        await queryRunner.query(`DROP TABLE IF EXISTS user_claims;`);
        await queryRunner.query(`DROP TABLE IF EXISTS campaigns;`);
        await queryRunner.query(`DROP TABLE IF EXISTS locations;`);
    }
}
