export declare class CreateNotificationDto {
    userId: number;
    title: string;
    message: string;
    type?: string;
    category?: string;
    data?: Record<string, unknown>;
}
export declare class UpdateNotificationDto {
    title?: string;
    message?: string;
    isRead?: boolean;
}
export declare class BulkSendDto {
    templateId: string;
    recipients: number[];
    variables?: Record<string, unknown>;
}
export declare class PushSubscribeDto {
    token: string;
    deviceId?: string;
}
export declare class PushUnsubscribeDto {
    token: string;
}
export declare class UpdateNotificationPreferenceDto {
    pushEnabled?: boolean;
    raceEnabled?: boolean;
    predictionEnabled?: boolean;
    subscriptionEnabled?: boolean;
    systemEnabled?: boolean;
    promotionEnabled?: boolean;
}
