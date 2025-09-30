import { BadRequestException, Body, Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NftService } from './nft.service';
import { CaptureDto } from './dto/capture.dto';
import { TransferDto } from './dto/transfer.dto';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Express } from 'express';

@ApiTags('nft')
@Controller()
export class NftController {
  constructor(private readonly service: NftService) {}

  @Get('user/nfts')
  async list(@Query('userId') userId?: string, @Query('status') status?: 'reserved' | 'transferred') {
    return this.service.userNfts(userId || '', status);
  }

  @Post('nft/transfer')
  async transfer(@Body() dto: TransferDto) {
    return this.service.transfer(dto.userId, dto.tokenId, dto.userWallet);
  }

  @Post('ar/capture')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        userId: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        locationId: { type: 'string' },
        radiusMeters: { type: 'number' },
      },
      required: ['image', 'userId', 'lat', 'lng', 'locationId'],
    },
  })
  async capture(@UploadedFile() file: Express.Multer.File, @Body() dto: CaptureDto) {
    if (!file) throw new BadRequestException('image required');
    return this.service.capture(dto.userId, dto.locationId, dto.lat, dto.lng, file.buffer, file.originalname, dto.radiusMeters || 100);
  }
}
