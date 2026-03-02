export interface NotificationPayload {
    tenantId: string;
    recipientPhone?: string;
    recipientEmail?: string;
    channel: 'whatsapp' | 'email' | 'sms' | 'push';
    templateName: string;
    templateData: Record<string, string>;
    scheduledFor?: Date;
    priority?: 'low' | 'normal' | 'high';
}

export interface INotificationChannel {
    readonly channelName: string;
    send(payload: NotificationPayload): Promise<{ success: boolean; externalId?: string; error?: string }>;
}
