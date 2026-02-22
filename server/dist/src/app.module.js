"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const auth_module_1 = require("./auth/auth.module");
const races_module_1 = require("./races/races.module");
const results_module_1 = require("./results/results.module");
const predictions_module_1 = require("./predictions/predictions.module");
const users_module_1 = require("./users/users.module");
const favorites_module_1 = require("./favorites/favorites.module");
const notifications_module_1 = require("./notifications/notifications.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const rankings_module_1 = require("./rankings/rankings.module");
const payments_module_1 = require("./payments/payments.module");
const prediction_tickets_module_1 = require("./prediction-tickets/prediction-tickets.module");
const single_purchases_module_1 = require("./single-purchases/single-purchases.module");
const points_module_1 = require("./points/points.module");
const bets_module_1 = require("./bets/bets.module");
const picks_module_1 = require("./picks/picks.module");
const kra_module_1 = require("./kra/kra.module");
const analysis_module_1 = require("./analysis/analysis.module");
const admin_module_1 = require("./admin/admin.module");
const config_module_1 = require("./config/config.module");
const health_module_1 = require("./health/health.module");
const cache_module_1 = require("./cache/cache.module");
const activity_logs_module_1 = require("./activity-logs/activity-logs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            cache_module_1.CacheModule,
            auth_module_1.AuthModule,
            races_module_1.RacesModule,
            results_module_1.ResultsModule,
            predictions_module_1.PredictionsModule,
            analysis_module_1.AnalysisModule,
            users_module_1.UsersModule,
            favorites_module_1.FavoritesModule,
            prediction_tickets_module_1.PredictionTicketsModule,
            picks_module_1.PicksModule,
            notifications_module_1.NotificationsModule,
            subscriptions_module_1.SubscriptionsModule,
            payments_module_1.PaymentsModule,
            rankings_module_1.RankingsModule,
            single_purchases_module_1.SinglePurchasesModule,
            points_module_1.PointsModule,
            bets_module_1.BetsModule,
            kra_module_1.KraModule,
            admin_module_1.AdminModule,
            config_module_1.GlobalConfigModule,
            activity_logs_module_1.ActivityLogsModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_interceptor_1.ResponseInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map