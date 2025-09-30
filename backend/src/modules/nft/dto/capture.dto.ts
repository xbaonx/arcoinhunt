import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CaptureDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsNumber()
  lat!: number;

  @ApiProperty()
  @IsNumber()
  lng!: number;

  @ApiProperty()
  @IsString()
  locationId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  radiusMeters?: number;
}
