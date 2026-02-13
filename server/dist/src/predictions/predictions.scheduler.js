"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PredictionsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionsScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const predictions_service_1 = require("./predictions.service");
const config_service_1 = require("../config/config.service");
let PredictionsScheduler = PredictionsScheduler_1 = class PredictionsScheduler {
    constructor(prisma, predictionsService, configService) {
        this.prisma = prisma;
        this.predictionsService = predictionsService;
        this.configService = configService;
        this.logger = new common_1.Logger(PredictionsScheduler_1.name);
    }
    async generatePredictionsForToday() {
        const raw = await this.configService.get('ai_config');
        const config = raw ? JSON.parse(raw) : {};
        if (config.enableBatchPrediction === false) {
            this.logger.log('[Cron] Batch prediction disabled in ai_config, skipping');
            return;
        }
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        this.logger.log(`[Cron] Generate predictions for ${today}`);
        const races = await this.prisma.race.findMany({
            where: {
                rcDate: today,
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                NOT: {
                    predictions: {
                        some: { status: 'COMPLETED' },
                    },
                },
            },
            select: { id: true, rcNo: true, meet: true },
        });
        if (!races.length) {
            this.logger.log(`[Cron] No races to predict for ${today}`);
            return;
        }
        let ok = 0;
        let fail = 0;
        for (const race of races) {
            try {
                await this.predictionsService.generatePrediction(race.id);
                ok++;
                this.logger.log(`[Cron] Prediction generated: ${race.meet} R${race.rcNo}`);
            }
            catch (err) {
                fail++;
                this.logger.error(`[Cron] Failed ${race.meet} R${race.rcNo}: ${err.message}`);
            }
        }
        this.logger.log(`[Cron] Done: ${ok} ok, ${fail} fail`);
    }
};
exports.PredictionsScheduler = PredictionsScheduler;
__decorate([
    (0, schedule_1.Cron)('0 9 * * 5,6,0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PredictionsScheduler.prototype, "generatePredictionsForToday", null);
exports.PredictionsScheduler = PredictionsScheduler = PredictionsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        predictions_service_1.PredictionsService,
        config_service_1.GlobalConfigService])
], PredictionsScheduler);
//# sourceMappingURL=predictions.scheduler.js.map