import { PrismaService } from '../prisma/prisma.service';
export declare class GlobalConfigService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<Record<string, string>>;
    get(key: string): Promise<string | null>;
    getBoolean(key: string, defaultValue?: boolean): Promise<boolean>;
    set(key: string, value: string): Promise<void>;
}
