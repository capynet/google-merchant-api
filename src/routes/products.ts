import { Router, NextFunction } from 'express';
import { GoogleShoppingService } from '../services/googleShopping';
import { oauth2Client, hasContentScope } from '../config/oauth';
import { ProductData } from '../types';

const router: Router = Router();
const shoppingService = new GoogleShoppingService();

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
    try {
        // Get merchantId from query param or use the first available account
        const merchantId = '5660240742';
        const products = await shoppingService.listProducts(merchantId);

        res.render('products', {
            products,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({error: 'Failed to fetch products: ' + (error as Error).message});
    }
});

router.post('/products/create', requireContentScope, async (req: any, res: any) => {
  const { title, description, price, brand, link, imageLink } = req.body;

  try {
    const targetMerchantId =  '5660240742';

    const productData: ProductData = {
      title,
      description,
      price,
      brand,
      link,
      imageLink
    };

    await shoppingService.createProduct(targetMerchantId, productData);
    res.redirect(`/products`);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product: ' + (error as Error).message });
  }
});

export default router;