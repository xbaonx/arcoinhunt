import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserClaim } from '../../entities/user-claim.entity';
import { ClaimsService } from './claims.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserClaim])],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
