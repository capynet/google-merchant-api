# Google Shopping Merchant Sample

Sample application demonstrating Google Shopping API integration for product management.

## Features

- OAuth 2.0 authentication with Google
- List Google Shopping products
- Create new products with sample data
- Web interface with Express and Handlebars

## Setup

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Google Cloud Project:**
   - Create a new project in Google Cloud Console
   - Enable the Content API for Shopping
   - Create OAuth 2.0 credentials (Web application)
   - Set authorized redirect URIs to `http://localhost:3000/auth/google/callback`

3. **Set up Google Merchant Center:**
   - Create a Google Merchant Center account
   - Link it to your Google Cloud project
   - Note your Merchant ID

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   SESSION_SECRET=your_session_secret
   GOOGLE_MERCHANT_ID=your_merchant_id
   PORT=3000
   ```

5. **Start the development server:**
   ```bash
   pnpm run dev
   ```

   The application will be available at `http://localhost:5173/`

## API Endpoints

- `GET /` - Main page with OAuth login
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /products` - List products (requires authentication)
- `POST /products/create` - Create new product (requires authentication)
- `GET /auth/logout` - Logout
