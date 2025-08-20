declare module "@invertase/react-native-apple-authentication" {
  export interface AppleAuthRequestOptions {
    requestedOperation: string;
    requestedScopes: string[];
  }

  export interface AppleAuthRequestResponse {
    identityToken: string | null;
    email: string | null;
    fullName: {
      givenName: string | null;
      familyName: string | null;
    } | null;
    user: string;
    state: string | null;
    nonce: string | null;
    realUserStatus: number;
  }

  export const appleAuth: {
    isSupported: boolean;
    Operation: {
      LOGIN: string;
      REFRESH: string;
      LOGOUT: string;
    };
    Scope: {
      EMAIL: string;
      FULL_NAME: string;
    };
    performRequest: (
      options: AppleAuthRequestOptions
    ) => Promise<AppleAuthRequestResponse>;
  };
}
