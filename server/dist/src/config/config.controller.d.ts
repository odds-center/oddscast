import { GlobalConfigService } from './config.service';
export declare class ConfigController {
    private configService;
    constructor(configService: GlobalConfigService);
    getAll(): Promise<Record<string, string>>;
    set(key: string, body: {
        value: string;
    }): Promise<{
        key: string;
        value: string;
    }>;
}
