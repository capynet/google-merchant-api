// @ts-ignore - El paquete no tiene tipos perfectos
import { ProductsServiceClient } from '@google-shopping/products';
import { oauth2Client } from '../config/oauth';
import { Product, ProductData, GoogleProductsResponse } from '../types';

export class GoogleShoppingService {
  private productsClient: ProductsServiceClient;

  constructor() {
    this.productsClient = new ProductsServiceClient({
      authClient: oauth2Client
    });
  }

  async listProducts(merchantId: string): Promise<GoogleProductsResponse> {
    try {
      const parent = `accounts/${merchantId}`;
      const request = { parent };

      const iterable = this.productsClient.listProductsAsync(request);
      const products: any[] = [];

      for await (const response of iterable) {
        products.push(response);
      }

      return {
        resources: products
      };
    } catch (error) {
      console.error('Error listing products:', error);
      throw error;
    }
  }

  async createProduct(merchantId: string, productData: ProductData): Promise<Product> {
    // TODO: Implementar con ProductInputs API
    // La nueva API requiere crear un data source primero
    // y luego usar productInputs:insert
    throw new Error('Create product not implemented yet with new Merchant API. Requires ProductInputs API setup.');
  }

  async getProduct(merchantId: string, productId: string): Promise<Product> {
    try {
      const name = `accounts/${merchantId}/products/${productId}`;
      const request = { name };

      const [response] = await this.productsClient.getProduct(request);
      return response as any;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  async deleteProduct(merchantId: string, productId: string): Promise<void> {
    // TODO: La nueva API no tiene método delete directo
    // Los productos se eliminan a través del data source
    throw new Error('Delete product not implemented yet with new Merchant API.');
  }
}