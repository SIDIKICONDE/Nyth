export interface UserSubscription {
    id: string;
    userId: string;
    planId: string;
    status: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    metadata?: {
        [key: string]: any;
    };
    endDate?: string;
    startDate?: string;
    usage?: {
        [key: string]: any;
    };
    paymentMethod?: {
        [key: string]: any;
    };
}
