"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_manager_1 = require("@nestjs/cache-manager");
const keyv_1 = require("keyv");
const redis_1 = __importDefault(require("@keyv/redis"));
const cacheable_1 = require("cacheable");
const TTL_MS = 60 * 60 * 1000;
const nestCacheModule = cache_manager_1.CacheModule.registerAsync({
    imports: [config_1.ConfigModule],
    inject: [config_1.ConfigService],
    useFactory: async (config) => {
        const redisUrl = config.get('REDIS_URL');
        const stores = [
            new keyv_1.Keyv({
                store: new cacheable_1.CacheableMemory({ ttl: TTL_MS, lruSize: 5000 }),
            }),
        ];
        if (redisUrl) {
            try {
                stores.push(new keyv_1.Keyv({ store: new redis_1.default(redisUrl) }));
            }
            catch (e) {
                console.warn('[Cache] Redis 연결 실패, 인메모리만 사용:', e.message);
            }
        }
        return {
            stores,
            ttl: TTL_MS,
            isGlobal: true,
        };
    },
});
let CacheModule = class CacheModule {
};
exports.CacheModule = CacheModule;
exports.CacheModule = CacheModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [nestCacheModule],
        exports: [nestCacheModule],
    })
], CacheModule);
//# sourceMappingURL=cache.module.js.map