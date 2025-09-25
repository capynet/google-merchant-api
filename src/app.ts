import express, { Express } from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import accountRoutes from './routes/accounts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

// Configure Handlebars
app.engine('hbs', engine({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: function(a: any, b: any) {
      return a === b;
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: true, // Force save session on every request
  saveUninitialized: true, // Save uninitialized sessions
  name: 'merchant-session',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: false
  }
}));

app.get('/', async (req: any, res: any) => {
  const isLoggedIn = !!req.session?.tokens;
  const user = req.session?.user;

  res.render('index', {
    isLoggedIn,
    user,
    title: 'Google Shopping Merchant Sample'
  });
});

app.use(authRoutes);
app.use(productRoutes);
app.use(accountRoutes);

// Servir archivos estáticos al final (para CSS, JS, imágenes, etc.)
app.use(express.static(path.join(__dirname, '../public')));

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app };
export default app;