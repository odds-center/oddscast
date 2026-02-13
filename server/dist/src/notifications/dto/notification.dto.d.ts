export declare class CreateNotificationDto {
    userId: string;
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
    recipients: string[];
    variables?: Record<string, unknown>;
}
export declare class UpdateNotificationPreferenceDto {
    pushEnabled?: boolean;
    raceEnabled?: boolean;
    predictionEnabled?: boolean;
    subscriptionEnabled?: boolean;
    systemEnabled?: boolean;
    promotionEnabled?: boolean;
}
