declare module "react-native-app-auth" {
  export interface AuthConfiguration {
    issuer: string;
    clientId: string;
    redirectUrl: string;
    scopes: string[];
    additionalParameters?: Record<string, string>;
  }

  export interface AuthorizeResult {
    accessToken: string;
    accessTokenExpirationDate: string;
    refreshToken?: string;
    idToken?: string;
    tokenType?: string;
    scopes: string[];
    authorizationCode?: string;
  }

  export function authorize(
    config: AuthConfiguration
  ): Promise<AuthorizeResult>;
  export function refresh(
    config: AuthConfiguration,
    refreshToken: string
  ): Promise<AuthorizeResult>;
  export function revoke(
    config: AuthConfiguration,
    tokenToRevoke: string
  ): Promise<void>;
}
