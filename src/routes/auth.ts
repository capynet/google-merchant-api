import Router from '@koa/router';
import { Context } from 'koa';
import { getAuthUrl, setCredentials, oauth2Client } from '../config/oauth';
import { AppContext } from '../types';

const router = new Router();

router.get('/auth/google', async (ctx: Context) => {
  const authUrl = getAuthUrl(false); // Solo scopes básicos
  ctx.redirect(authUrl);
});

router.get('/auth/google/callback', async (ctx: Context & AppContext) => {
  const { code } = ctx.query;

  if (!code || typeof code !== 'string') {
    ctx.status = 400;
    ctx.body = { error: 'Authorization code is required' };
    return;
  }

  try {
    const { tokens } = await setCredentials(code);
    oauth2Client.setCredentials(tokens);

    // Guardar tokens en sesión
    ctx.session!.tokens = tokens;

    // Obtener información del usuario de Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    const userInfo = await response.json();

    console.log('User info from Google:', userInfo);
    ctx.session!.user = userInfo;

    ctx.redirect('/');
  } catch (error) {
    console.error('OAuth error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Authentication failed' };
  }
});

router.get('/auth/request-merchant-access', async (ctx: Context & AppContext) => {
  if (!ctx.session?.tokens) {
    ctx.redirect('/');
    return;
  }

  // Generar URL de autorización con el scope de Merchant adicional
  const authUrl = getAuthUrl(true);

  // Página de solicitud de permisos
  ctx.body = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Merchant Access Required</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; }
            .container { background: #f8f9fa; padding: 40px; border-radius: 8px; text-align: center; }
            h1 { color: #333; }
            p { color: #666; margin: 20px 0; }
            .btn { display: inline-block; padding: 12px 30px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .btn:hover { background: #3367d6; }
            .btn-secondary { background: #6c757d; margin-left: 10px; }
            .btn-secondary:hover { background: #5a6268; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Additional Permissions Required</h1>
            <p>To access Google Merchant Center products, we need your permission to manage your product catalog.</p>
            <p>This will allow the app to:</p>
            <ul style="text-align: left; display: inline-block; color: #666;">
                <li>View your Google Merchant Center products</li>
                <li>Create and update product listings</li>
                <li>Manage product inventory</li>
            </ul>
            <a href="${authUrl}" class="btn">Grant Access</a>
            <a href="/" class="btn btn-secondary">Cancel</a>
        </div>
    </body>
    </html>
  `;
  ctx.type = 'html';
});

router.get('/auth/logout', async (ctx: Context & AppContext) => {
  ctx.session = null;
  ctx.redirect('/');
});

export default router;