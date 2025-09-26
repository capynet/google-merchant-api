import { Router, NextFunction } from 'express';
import { googleShoppingService } from '../services/googleShopping';
import { oauth2Client, hasContentScope } from '../config/oauth';
import { ProductData } from '../types';
import { DataSourcesServiceClient, protos } from '@google-shopping/datasources';

const router: Router = Router();

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
        const products = await googleShoppingService.listProducts();

        res.render('products', {
            products,
            error: req.query.error,
            success: req.query.success
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({error: 'Failed to fetch products: ' + (error as Error).message});
    }
});

router.post('/products/create', requireContentScope, async (req: any, res: any) => {
  const { title, description, price, brand, link, imageLink } = req.body;

  try {

    const productData: ProductData = {
      title,
      description,
      price,
      brand,
      link,
      imageLink
    };

    await googleShoppingService.createProduct(productData);
    res.redirect(`/products`);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product: ' + (error as Error).message });
  }
});

router.post('/products/datasource', requireContentScope, async (req: any, res: any) => {
  try {
    const merchantId = '5661333043';

    // Crear cliente de DataSources con autenticación OAuth2
    const dataSourcesClient = new DataSourcesServiceClient({
      authClient: oauth2Client,
    });

    // Valores hardcodeados basados en el ejemplo con tipos correctos
    const dataSource: protos.google.shopping.merchant.datasources.v1.IDataSource = {
      displayName: 'API data source',
      primaryProductDataSource: {
        feedLabel: 'FEED_THING',
        contentLanguage: 'en',
        countries: ['US']
      }
    };

    const request: protos.google.shopping.merchant.datasources.v1.ICreateDataSourceRequest = {
      parent: `accounts/${merchantId}`,
      dataSource: dataSource
    };

    // Crear el datasource
    const [response] = await dataSourcesClient.createDataSource(request);
    console.log('DataSource created successfully:', response);

    // Redirigir con mensaje de éxito
    res.redirect('/products?success=DataSource created successfully');
  } catch (error) {
    console.error('Error creating datasource:', error);
    res.redirect('/products?error=' + encodeURIComponent('Failed to create datasource: ' + (error as Error).message));
  }
});

export default router;