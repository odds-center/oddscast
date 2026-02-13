"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PicksModule = void 0;
const common_1 = require("@nestjs/common");
const picks_controller_1 = require("./picks.controller");
const picks_service_1 = require("./picks.service");
const prisma_module_1 = require("../prisma/prisma.module");
let PicksModule = class PicksModule {
};
exports.PicksModule = PicksModule;
exports.PicksModule = PicksModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [picks_controller_1.PicksController],
        providers: [picks_service_1.PicksService],
        exports: [picks_service_1.PicksService],
    })
], PicksModule);
//# sourceMappingURL=picks.module.js.map