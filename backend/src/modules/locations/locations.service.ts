import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(@InjectRepository(Location) private repo: Repository<Location>) {}

  async nearby(lat: number, lng: number, radiusMeters: number, userId?: string) {
    // Filter out locations already claimed by user via NOT EXISTS on user_claims
    const rows = await this.repo.query(
      `SELECT l.id, l.name, ST_Y(l.geom::geometry) as lat, ST_X(l.geom::geometry) as lng,
              ST_DistanceSphere(l.geom, ST_MakePoint($1, $2)) as distance
       FROM locations l
       WHERE ST_DWithin(l.geom, ST_MakePoint($1, $2), $3)
         AND NOT EXISTS (
           SELECT 1 FROM user_claims uc WHERE uc.user_id = $4 AND uc.location_id = l.id
         )
       ORDER BY distance ASC
       LIMIT 50`,
      [lng, lat, radiusMeters, userId || '']
    );
    return rows;
  }
}
