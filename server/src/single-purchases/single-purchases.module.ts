import { Module } from '@nestjs/common';
import { GlobalConfigModule } from '../config/config.module';
import { SinglePurchasesController } from './single-purchases.controller';
import { SinglePurchasesService } from './single-purchases.service';

@Module({
  imports: [GlobalConfigModule],
  controllers: [SinglePurchasesController],
  providers: [SinglePurchasesService],
  exports: [SinglePurchasesService],
})
export class SinglePurchasesModule {}
