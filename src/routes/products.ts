import {Router, NextFunction} from 'express';
import {googleShoppingService} from '../services/googleShopping';
import {oauth2Client, hasContentScope} from '../config/oauth';
import {DataSourcesServiceClient, protos} from '@google-shopping/datasources';

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
        const products = await googleShoppingService.listProducts();

        res.render('products', {
            products: {resources: products || []},
            error: req.query.error,
            success: req.query.success
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({error: 'Failed to fetch products: ' + (error as Error).message});
    }
});

router.get('/products/filtered', requireContentScope, async (req: any, res: any) => {
    try {
        const options = {
            filters: {
                offer_id: ['TEST_PRODUCT_1759147361903_3', 'TEST_PRODUCT_1759147377697_59']
            },
            fields: ['id', 'offer_id', 'title', 'availability'],
            maxResults: 100
        };

        console.log('Fetching filtered products with static options:', options);

        const products = await googleShoppingService.getFilteredProducts(options);

        res.json({
            success: true,
            count: products.length,
            query: options,
            products: products
        });
    } catch (error) {
        console.error('Error fetching filtered products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch filtered products: ' + (error as Error).message
        });
    }
});

router.post('/products/create', requireContentScope, async (req: any, res: any) => {
    try {
        await googleShoppingService.createProduct(req.body);
        res.redirect(`/products`);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({error: 'Failed to create product: ' + (error as Error).message});
    }
});

router.post('/products/datasource', requireContentScope, async (req: any, res: any) => {
    try {
        const merchantId = '5661333043';

        const dataSourcesClient = new DataSourcesServiceClient({
            authClient: oauth2Client,
        });

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

        const [response] = await dataSourcesClient.createDataSource(request);
        console.log('DataSource created successfully:', response);

        // Redirigir con mensaje de éxito
        res.redirect('/products?success=DataSource created successfully');
    } catch (error) {
        console.error('Error creating datasource:', error);
        res.redirect('/products?error=' + encodeURIComponent('Failed to create datasource: ' + (error as Error).message));
    }
});

router.post('/products/generate-bulk', requireContentScope, async (req: any, res: any) => {
    try {
        const numberOfProducts = 200;
        const results = {
            created: 0,
            failed: 0,
            errors: [] as string[]
        };

        console.log(`Starting bulk generation of ${numberOfProducts} products...`);

        // Generate products in batches to avoid overwhelming the API
        const batchSize = 10;
        const batches = Math.ceil(numberOfProducts / batchSize);

        for (let batch = 0; batch < batches; batch++) {
            const batchStart = batch * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, numberOfProducts);

            const promises = [];

            for (let i = batchStart; i < batchEnd; i++) {
                const productData = {
                    offerId: `TEST_PRODUCT_${Date.now()}_${i}`,
                    feedLabel: 'FEED_THING',
                    contentLang: 'en',
                    title: `Test Product ${i + 1}`,
                    description: `This is a test product number ${i + 1}. It includes various features and specifications that make it suitable for testing purposes.`,
                    link: `https://example.com/products/test-product-${i + 1}`,
                    imageLink: `https://picsum.photos/seed/product/600/400`,
                    price: (Math.random() * 900 + 10).toFixed(2),
                    currencyCode: 'USD',
                    brand: ['TestBrand', 'SampleBrand', 'DemoBrand', 'ExampleCo'][Math.floor(Math.random() * 4)],
                    condition: ['NEW', 'REFURBISHED', 'USED'][Math.floor(Math.random() * 3)],
                    availability: ['IN_STOCK', 'OUT_OF_STOCK', 'PREORDER'][Math.floor(Math.random() * 3)]
                };

                promises.push(
                    googleShoppingService.createProduct(productData)
                        .then(() => {
                            results.created++;
                            console.log(`Created product ${i + 1}/${numberOfProducts}`);
                        })
                        .catch((error) => {
                            results.failed++;
                            results.errors.push(`Product ${i + 1}: ${error.message}`);
                            console.error(`Failed to create product ${i + 1}:`, error.message);
                        })
                );
            }

            // Wait for batch to complete before starting next batch
            await Promise.all(promises);

            // Add a small delay between batches to avoid rate limiting
            if (batch < batches - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`Bulk generation completed: ${results.created} created, ${results.failed} failed`);

        let message = `Generated ${results.created} products successfully`;
        if (results.failed > 0) {
            message += ` (${results.failed} failed)`;
        }

        res.redirect(`/products?success=${encodeURIComponent(message)}`);
    } catch (error) {
        console.error('Error generating bulk products:', error);
        res.redirect('/products?error=' + encodeURIComponent('Failed to generate products: ' + (error as Error).message));
    }
});

export default router;