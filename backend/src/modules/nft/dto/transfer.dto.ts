import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';

export class TransferDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  tokenId!: string;

  @ApiProperty()
  @IsEthereumAddress()
  userWallet!: string;
}
