"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const admin_controller_1 = require("./admin.controller");
const admin_auth_controller_1 = require("./admin-auth.controller");
const admin_races_controller_1 = require("./admin-races.controller");
const admin_results_controller_1 = require("./admin-results.controller");
const admin_predictions_controller_1 = require("./admin-predictions.controller");
const auth_module_1 = require("../auth/auth.module");
const kra_module_1 = require("../kra/kra.module");
const users_module_1 = require("../users/users.module");
const config_module_1 = require("../config/config.module");
const prisma_module_1 = require("../prisma/prisma.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const notifications_module_1 = require("../notifications/notifications.module");
const single_purchases_module_1 = require("../single-purchases/single-purchases.module");
const races_module_1 = require("../races/races.module");
const results_module_1 = require("../results/results.module");
const predictions_module_1 = require("../predictions/predictions.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            kra_module_1.KraModule,
            users_module_1.UsersModule,
            config_module_1.GlobalConfigModule,
            prisma_module_1.PrismaModule,
            subscriptions_module_1.SubscriptionsModule,
            notifications_module_1.NotificationsModule,
            single_purchases_module_1.SinglePurchasesModule,
            races_module_1.RacesModule,
            results_module_1.ResultsModule,
            predictions_module_1.PredictionsModule,
        ],
        controllers: [
            admin_controller_1.AdminController,
            admin_auth_controller_1.AdminAuthController,
            admin_races_controller_1.AdminRacesController,
            admin_results_controller_1.AdminResultsController,
            admin_predictions_controller_1.AdminPredictionsController,
        ],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map