export declare class HealthController {
    check(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
    };
    detailed(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
        environment: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        nodeVersion: string;
        platform: NodeJS.Platform;
    };
}
