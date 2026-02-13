"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KraModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const schedule_1 = require("@nestjs/schedule");
const kra_service_1 = require("./kra.service");
const kra_controller_1 = require("./kra.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const config_1 = require("@nestjs/config");
const cache_module_1 = require("../cache/cache.module");
let KraModule = class KraModule {
};
exports.KraModule = KraModule;
exports.KraModule = KraModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule, schedule_1.ScheduleModule.forRoot(), prisma_module_1.PrismaModule, config_1.ConfigModule, cache_module_1.CacheModule],
        controllers: [kra_controller_1.KraController],
        providers: [kra_service_1.KraService],
        exports: [kra_service_1.KraService],
    })
], KraModule);
//# sourceMappingURL=kra.module.js.map