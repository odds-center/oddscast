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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GlobalConfigService = class GlobalConfigService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll() {
        const rows = await this.prisma.globalConfig.findMany();
        const map = {};
        for (const row of rows) {
            map[row.key] = row.value;
        }
        return map;
    }
    async get(key) {
        const row = await this.prisma.globalConfig.findUnique({
            where: { key: key },
        });
        return row?.value ?? null;
    }
    async getBoolean(key, defaultValue = false) {
        const val = await this.get(key);
        if (val === null || val === undefined)
            return defaultValue;
        return val === 'true' || val === '1' || val === 'yes';
    }
    async set(key, value) {
        await this.prisma.globalConfig.upsert({
            where: { key },
            create: { key, value },
            update: { value },
        });
    }
};
exports.GlobalConfigService = GlobalConfigService;
exports.GlobalConfigService = GlobalConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GlobalConfigService);
//# sourceMappingURL=config.service.js.map