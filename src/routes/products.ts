import { Router, Request, Response, NextFunction } from 'express';
import { GoogleShoppingService } from '../services/googleShopping';
import { oauth2Client, hasContentScope } from '../config/oauth';
import { ProductData } from '../types';

const router: Router = Router();
const shoppingService = new GoogleShoppingService();

async function requireAuth(req: any, res: any, next: NextFunction): Promise<void> {
  if (!req.session?.tokens) {
    res.redirect('/');
    return;
  }
  oauth2Client.setCredentials(req.session.tokens);
  next();
}

async function requireContentScope(req: any, res: any, next: NextFunction): Promise<void> {
  if (!req.session?.tokens) {
    res.redirect('/');
    return;
  }

  const hasScope = await hasContentScope(req.session.tokens);
  if (!hasScope) {
    res.redirect('/auth/request-merchant-access');
    return;
  }

  oauth2Client.setCredentials(req.session.tokens);
  next();
}

router.get('/products', requireContentScope, async (req: any, res: any) => {
  const merchantId = (req.query.merchantId as string) || process.env.GOOGLE_MERCHANT_ID;

  if (!merchantId) {
    res.status(400).json({ error: 'Merchant ID is required' });
    return;
  }

  try {
    const products = await shoppingService.listProducts(merchantId);

    res.render('products', {
      products,
      merchantId,
      title: 'Google Shopping Products'
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products: ' + (error as Error).message });
  }
});

router.post('/products/create', requireContentScope, async (req: any, res: any) => {
  const { merchantId, title, description, price, brand, link, imageLink } = req.body;

  if (!merchantId) {
    res.status(400).json({ error: 'Merchant ID is required' });
    return;
  }

  try {
    const productData: ProductData = {
      title,
      description,
      price,
      brand,
      link,
      imageLink
    };

    await shoppingService.createProduct(merchantId, productData);
    res.redirect(`/products?merchantId=${merchantId}`);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product: ' + (error as Error).message });
  }
});

export default router;