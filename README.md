# Google Shopping Merchant Sample

A TypeScript Koa.js application that demonstrates integration with Google Shopping API for managing products.

## Features

- OAuth 2.0 authentication with Google
- List Google Shopping products
- Create new products with sample data
- Product management interface
- Responsive web interface

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
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

5. **Run the application:**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production build and run
   npm run prod

   # Type checking only
   npm run typecheck
   ```

6. **Open your browser:**
   Navigate to `http://localhost:3000`

## API Endpoints

- `GET /` - Main page with OAuth login
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /products` - List products (requires authentication)
- `POST /products/create` - Create new product (requires authentication)
- `GET /auth/logout` - Logout

## Project Structure

```
├── src/
│   ├── app.ts                 # Main server file
│   ├── config/
│   │   └── oauth.ts          # Google OAuth configuration
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   └── products.ts       # Product management routes
│   ├── services/
│   │   └── googleShopping.ts # Google Shopping API service
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── public/
│   └── index.html            # Frontend interface
├── dist/                     # Compiled JavaScript (generated)
├── tsconfig.json             # TypeScript configuration
├── nodemon.json              # Nodemon configuration
└── .env.example              # Environment variables template
```

## Dependencies

- **koa** - Web framework
- **@koa/router** - Routing
- **@koa/cors** - CORS middleware
- **koa-bodyparser** - Body parsing
- **koa-static** - Static file serving
- **koa-session** - Session management
- **googleapis** - Google APIs client
- **@google-shopping/products** - Google Shopping API
- **dotenv** - Environment variables

## Notes

- Make sure your Google Cloud project has the Content API enabled
- Your Google Merchant Center account must be verified and approved
- The application uses sample data for product creation
- Products created through this app will appear in your Google Merchant Center