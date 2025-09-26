import { Router, Request, Response } from 'express';
import { getAuthUrl, setCredentials, oauth2Client } from '../config/oauth';
import { googleShoppingService } from '../services/googleShopping';

const router: Router = Router();

router.get('/auth/google', async (req: Request, res: Response) => {
  const authUrl = getAuthUrl(false); // Solo scopes básicos
  res.redirect(authUrl);
});

router.get('/auth/google/callback', async (req: any, res: any) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Authorization code is required' });
    return;
  }

  try {
    const { tokens } = await setCredentials(code);
    oauth2Client.setCredentials(tokens);

    // Guardar tokens en sesión
    req.session.tokens = tokens;

    // Obtener información del usuario de Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    const userInfo = await response.json();

    console.log('User info from Google:', userInfo);
    req.session.user = userInfo;

    res.redirect('/');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/auth/request-merchant-access', async (req: any, res: any) => {
  if (!req.session?.tokens) {
    res.redirect('/');
    return;
  }

  // Generar URL de autorización con el scope de Merchant adicional
  const authUrl = getAuthUrl(true);

  res.render('merchant-access', {
    authUrl,
    title: 'Merchant Access Required'
  });
});

router.get('/auth/register-gcp', async (req: any, res: any) => {
  if (!req.session?.tokens) {
    res.redirect('/');
    return;
  }

  res.render('register-gcp', {
    title: 'Register GCP Project'
  });
});

router.post('/auth/register-gcp', async (req: any, res: any) => {
  if (!req.session?.tokens) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const developerEmail = 'capy.net@gmail.com';

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const result = await googleShoppingService.registerGcpProject(developerEmail);
    res.json({
      success: true,
      data: result,
      message: 'GCP project registered successfully. Please wait 5 minutes for changes to propagate.'
    });
  } catch (error: any) {
    console.error('Error registering GCP project:', error);

    // Check if it's already registered
    if (error.message?.includes('already registered')) {
      res.json({
        success: true,
        message: 'GCP project is already registered with this merchant account.'
      });
    } else {
      res.status(500).json({
        error: 'Failed to register GCP project',
        details: error.message || 'Unknown error occurred'
      });
    }
  }
});

router.get('/auth/logout', async (req: any, res: any) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

export default router;