import { Controller, Get } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';

@Controller('campaign')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Get('status')
  async status() {
    return this.service.status();
  }
}
