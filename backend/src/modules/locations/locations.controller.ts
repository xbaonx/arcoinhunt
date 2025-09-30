import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller()
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get('coins/nearby')
  async nearby(
    @Query('lat') latStr?: string,
    @Query('lng') lngStr?: string,
    @Query('radius') radiusStr?: string,
    @Query('userId') userId?: string,
  ) {
    const lat = Number(latStr);
    const lng = Number(lngStr);
    const radius = radiusStr ? Number(radiusStr) : 100;
    if (!isFinite(lat) || !isFinite(lng)) throw new BadRequestException('lat,lng required');
    if (!isFinite(radius) || radius <= 0 || radius > 2000) throw new BadRequestException('invalid radius');
    const rows = await this.locations.nearby(lat, lng, radius, userId);
    return { items: rows };
  }
}
