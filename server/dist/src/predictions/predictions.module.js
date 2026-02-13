"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionsModule = void 0;
const common_1 = require("@nestjs/common");
const predictions_service_1 = require("./predictions.service");
const predictions_controller_1 = require("./predictions.controller");
const predictions_scheduler_1 = require("./predictions.scheduler");
const analysis_module_1 = require("../analysis/analysis.module");
const config_module_1 = require("../config/config.module");
let PredictionsModule = class PredictionsModule {
};
exports.PredictionsModule = PredictionsModule;
exports.PredictionsModule = PredictionsModule = __decorate([
    (0, common_1.Module)({
        imports: [analysis_module_1.AnalysisModule, config_module_1.GlobalConfigModule],
        controllers: [predictions_controller_1.PredictionsController],
        providers: [predictions_service_1.PredictionsService, predictions_scheduler_1.PredictionsScheduler],
        exports: [predictions_service_1.PredictionsService],
    })
], PredictionsModule);
//# sourceMappingURL=predictions.module.js.map