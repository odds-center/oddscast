import { PrismaService } from '../prisma/prisma.service';
import { PredictionsService } from './predictions.service';
import { GlobalConfigService } from '../config/config.service';
export declare class PredictionsScheduler {
    private prisma;
    private predictionsService;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, predictionsService: PredictionsService, configService: GlobalConfigService);
    generatePredictionsForToday(): Promise<void>;
}
