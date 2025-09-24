export interface Product {
  id?: string;
  offerId: string;
  title: string;
  description?: string;
  link?: string;
  imageLink?: string;
  contentLanguage: string;
  targetCountry: string;
  channel: string;
  availability: string;
  condition: string;
  price: {
    value: string;
    currency: string;
  };
  brand?: string;
  gtin?: string;
}

export interface ProductData {
  offerId?: string;
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
  resources?: Product[];
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