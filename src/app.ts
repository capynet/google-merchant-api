import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import cors from '@koa/cors';
import session from 'koa-session';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';

dotenv.config();

const app = new Koa();
const router = new Router();

app.keys = [process.env.SESSION_SECRET || 'your-session-secret-key'];

const CONFIG = {
  key: 'koa.sess',
  maxAge: 86400000,
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false,
  secure: false,
} as const;

app.use(session(CONFIG, app));
app.use(cors());
app.use(bodyParser());

// NO servir archivos estáticos antes de las rutas dinámicas
// app.use(serve(path.join(__dirname, '../public')));

router.get('/', async (ctx: any) => {
    console.log('veamos');
  const isLoggedIn = !!ctx.session?.tokens;
  const user = ctx.session?.user;

  let html = await fs.readFile(path.join(__dirname, '../public', 'index.html'), 'utf8');

  console.log('isLoggedIn');
  // Reemplazar placeholders dinámicamente
  if (isLoggedIn && user) {
    html = html.replace('<!-- USER_INFO -->', `
      <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Logged in as:</strong> ${user.email}</p>
        <a href="/products" style="padding: 8px 16px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px;">View Products</a>
        <a href="/auth/logout" style="padding: 8px 16px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px;">Logout</a>
      </div>
    `);
    html = html.replace('<!-- LOGIN_BUTTON -->', '');
  } else {
    html = html.replace('<!-- USER_INFO -->', '');
    html = html.replace('<!-- LOGIN_BUTTON -->', `
      <a href="/auth/google" style="display: inline-block; padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">
        Sign in with Google
      </a>
    `);
  }

  ctx.type = 'html';
  ctx.body = html;
});

app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

app.use(productRoutes.routes());
app.use(productRoutes.allowedMethods());

app.use(router.routes());
app.use(router.allowedMethods());

// Servir archivos estáticos al final (para CSS, JS, imágenes, etc.)
app.use(serve(path.join(__dirname, '../public')));

app.on('error', (err, ctx) => {
  console.error('Server error:', err);
});

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;