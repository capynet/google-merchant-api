export interface ProductData {
    title?: string;
    description?: string;
    link?: string;
    imageLink?: string;
    price?: string;
    brand?: string;
    gtin?: string;
}

export interface GoogleProductsResponse {
    kind?: string;
    nextPageToken?: string;
    resources?: any[]; // This will be populated with IProduct objects
}

export interface OAuthTokens {
    access_token?: string | null;
    refresh_token?: string | null;
    scope?: string;
    token_type?: string;
    expiry_date?: number;
}

export interface AppContext {
    session?: {
        tokens?: any;
        user?: any;
    } | null;
}

export interface MerchantAccount {
    name?: string;
    accountId?: string;
    kind?: string;
    businessInformation?: any;
    adultContent?: boolean;
    businessName?: string;
    businessAddress?: any;
}

export interface MerchantAccountsResponse {
    kind?: string;
    nextPageToken?: string;
    resources?: MerchantAccount[];
}

export interface GcpRegistrationRequest {
    projectId: string;
    email: string;
}