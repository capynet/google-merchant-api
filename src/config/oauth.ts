import {google} from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const BASIC_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

const MERCHANT_SCOPE = 'https://www.googleapis.com/auth/content';

export function getAuthUrl(includeContent: boolean = false): string {
    const scopes = includeContent
        ? [...BASIC_SCOPES, MERCHANT_SCOPE]
        : BASIC_SCOPES;

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true
    });
}

export async function setCredentials(code: string) {
    return oauth2Client.getToken(code);
}

export async function hasContentScope(tokens: any): Promise<boolean> {
    if (!tokens || !tokens.scope) {
        return false;
    }

    const scopes = typeof tokens.scope === 'string'
        ? tokens.scope.split(' ')
        : tokens.scope;

    return scopes.includes(MERCHANT_SCOPE);
}

export async function ensureValidTokens(): Promise<void> {
    const tokens = oauth2Client.credentials;
    if (!tokens || !tokens.access_token) {
        throw new Error('No valid tokens available');
    }

    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
        if (tokens.refresh_token) {
            const {credentials} = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
        } else {
            throw new Error('Access token expired and no refresh token available');
        }
    }
}

export {oauth2Client, MERCHANT_SCOPE};