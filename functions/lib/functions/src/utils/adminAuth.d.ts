export declare const assertSuperAdmin: (uid: string) => Promise<void>;
export declare const serverLogAdminAccess: (uid: string, action: string, success: boolean, details?: Record<string, unknown>) => Promise<void>;
