import Router from '@koa/router';
import { Context, Next } from 'koa';
import { GoogleShoppingService } from '../services/googleShopping';
import { oauth2Client, hasContentScope } from '../config/oauth';
import { AppContext, ProductData } from '../types';

const router = new Router();
const shoppingService = new GoogleShoppingService();

async function requireAuth(ctx: Context & AppContext, next: Next): Promise<void> {
  if (!ctx.session?.tokens) {
    ctx.redirect('/');
    return;
  }
  oauth2Client.setCredentials(ctx.session.tokens);
  await next();
}

async function requireContentScope(ctx: Context & AppContext, next: Next): Promise<void> {
  if (!ctx.session?.tokens) {
    ctx.redirect('/');
    return;
  }

  const hasScope = await hasContentScope(ctx.session.tokens);
  if (!hasScope) {
    ctx.redirect('/auth/request-merchant-access');
    return;
  }

  oauth2Client.setCredentials(ctx.session.tokens);
  await next();
}

router.get('/products', requireContentScope, async (ctx: Context & AppContext) => {
  const merchantId = (ctx.query.merchantId as string) || process.env.GOOGLE_MERCHANT_ID;

  if (!merchantId) {
    ctx.status = 400;
    ctx.body = { error: 'Merchant ID is required' };
    return;
  }

  try {
    const products = await shoppingService.listProducts(merchantId);

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google Shopping Products</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .btn { padding: 10px 20px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; border: none; cursor: pointer; }
            .btn:hover { background: #3367d6; }
            .btn-secondary { background: #6c757d; }
            .btn-secondary:hover { background: #5a6268; }
            .product { border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; }
            .form-group { margin: 15px 0; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
            .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            .create-form { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Google Shopping Products</h1>
            <a href="/auth/logout" class="btn btn-secondary">Logout</a>
        </div>

        <div class="create-form">
            <h2>Create New Product</h2>
            <form method="POST" action="/products/create">
                <input type="hidden" name="merchantId" value="${merchantId}">
                <div class="form-group">
                    <label>Title:</label>
                    <input type="text" name="title" placeholder="Product Title" required>
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea name="description" placeholder="Product Description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Price:</label>
                    <input type="number" name="price" placeholder="29.99" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Brand:</label>
                    <input type="text" name="brand" placeholder="Brand Name">
                </div>
                <div class="form-group">
                    <label>Product Link:</label>
                    <input type="url" name="link" placeholder="https://example.com/product">
                </div>
                <div class="form-group">
                    <label>Image Link:</label>
                    <input type="url" name="imageLink" placeholder="https://example.com/image.jpg">
                </div>
                <button type="submit" class="btn">Create Product</button>
            </form>
        </div>

        <h2>Your Products</h2>
        ${products.resources ? products.resources.map(product => `
            <div class="product">
                <h3>${product.title || 'Untitled Product'}</h3>
                <p><strong>ID:</strong> ${product.id}</p>
                <p><strong>Offer ID:</strong> ${product.offerId}</p>
                <p><strong>Price:</strong> ${product.price ? product.price.value + ' ' + product.price.currency : 'N/A'}</p>
                <p><strong>Availability:</strong> ${product.availability || 'N/A'}</p>
                <p><strong>Condition:</strong> ${product.condition || 'N/A'}</p>
                ${product.imageLink ? `<img src="${product.imageLink}" alt="${product.title}" style="max-width: 100px; height: auto;">` : ''}
            </div>
        `).join('') : '<p>No products found.</p>'}
    </body>
    </html>`;

    ctx.type = 'html';
    ctx.body = html;
  } catch (error) {
    console.error('Error fetching products:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch products: ' + (error as Error).message };
  }
});

router.post('/products/create', requireContentScope, async (ctx: Context & AppContext) => {
  const body = ctx.request.body as any;
  const { merchantId, title, description, price, brand, link, imageLink } = body;

  if (!merchantId) {
    ctx.status = 400;
    ctx.body = { error: 'Merchant ID is required' };
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
    ctx.redirect(`/products?merchantId=${merchantId}`);
  } catch (error) {
    console.error('Error creating product:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to create product: ' + (error as Error).message };
  }
});

export default router;