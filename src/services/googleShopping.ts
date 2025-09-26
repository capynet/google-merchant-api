// @ts-ignore - El paquete no tiene tipos perfectos
import { ProductsServiceClient, ProductInputsServiceClient, protos } from '@google-shopping/products';
// @ts-ignore - El paquete no tiene tipos perfectos
import { AccountsServiceClient, DeveloperRegistrationServiceClient } from '@google-shopping/accounts';
// @ts-ignore - El paquete no tiene tipos perfectos
import { DataSourcesServiceClient, protos as datasourceProtos } from '@google-shopping/datasources';
import { oauth2Client } from '../config/oauth';
import {ProductData, GoogleProductsResponse, MerchantAccountsResponse} from '../types';

class GoogleShoppingService {
  private static instance: GoogleShoppingService;
  private productsClient: ProductsServiceClient;
  private productInputsClient: ProductInputsServiceClient;
  private accountsClient: AccountsServiceClient;
  private developerRegistrationClient: DeveloperRegistrationServiceClient;
  private dataSourcesClient: DataSourcesServiceClient;
  private readonly merchantId: string;
  private readonly dataSourceId: string;

  private constructor() {
    this.productsClient = new ProductsServiceClient({
      authClient: oauth2Client
    });
    this.productInputsClient = new ProductInputsServiceClient({
      authClient: oauth2Client
    });
    this.accountsClient = new AccountsServiceClient({
      authClient: oauth2Client
    });
    this.developerRegistrationClient = new DeveloperRegistrationServiceClient({
      authClient: oauth2Client
    });
    this.dataSourcesClient = new DataSourcesServiceClient({
      authClient: oauth2Client
    });

      this.merchantId = '5661333043';
      this.dataSourceId = '10571493917';
  }

  public static getInstance(): GoogleShoppingService {
    if (!GoogleShoppingService.instance) {
      GoogleShoppingService.instance = new GoogleShoppingService();
    }
    return GoogleShoppingService.instance;
  }

  // Ensure tokens are fresh before API calls
  private async ensureValidTokens(): Promise<void> {
    const tokens = oauth2Client.credentials;
    if (!tokens || !tokens.access_token) {
      throw new Error('No valid tokens available');
    }

    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
      if (tokens.refresh_token) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
      } else {
        throw new Error('Access token expired and no refresh token available');
      }
    }
  }

  async listProducts(): Promise<GoogleProductsResponse> {
    try {
      await this.ensureValidTokens();

      const parent = `accounts/${this.merchantId}`;
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


  async createProduct(productData: ProductData): Promise<protos.google.shopping.merchant.products.v1.IProduct> {
    try {
      await this.ensureValidTokens();

      // Create a unique product ID (offerId)
      const offerId = `product_${Date.now()}`;
      const parent = `accounts/${this.merchantId}`;

      // Get the first available data source
      const dataSourcePath = `accounts/${this.merchantId}/dataSources/${this.dataSourceId}`;

        const productInput: protos.google.shopping.merchant.products.v1.IProductInput = {
            offerId: offerId,
            contentLanguage: 'en',
            feedLabel: 'FEED_THING',
            productAttributes: {
                title: productData.title,
                description: productData.description,
                link: productData.link,
                imageLink: productData.imageLink,
                price: {
                    amountMicros: (parseFloat(productData.price || '0') * 1000000).toString(),
                    currencyCode: 'USD'
                },
                brand: productData.brand,
                condition: protos.google.shopping.merchant.products.v1.Condition.NEW,
                availability: protos.google.shopping.merchant.products.v1.Availability.IN_STOCK
            }
        };

      const request = {
        parent: parent,
        productInput: productInput,
        dataSource: dataSourcePath
      };

      console.log('Creating product with request:', JSON.stringify(request, null, 2));

      const response = await this.productInputsClient.insertProductInput(request);

      console.log('Product creation response:', response);
      return response as any;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async getProduct(productId: string): Promise<protos.google.shopping.merchant.products.v1.IProduct> {
    try {
      await this.ensureValidTokens();

      const name = `accounts/${this.merchantId}/products/${productId}`;
      const request = { name };

      const [response] = await this.productsClient.getProduct(request);
      return response as any;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  async listMerchantAccounts(): Promise<MerchantAccountsResponse> {
    try {
      await this.ensureValidTokens();

      const iterable = this.accountsClient.listAccountsAsync({});
      const accounts: any[] = [];

      for await (const account of iterable) {
        // Transform the account data to match our interface
        accounts.push({
          accountId: account.name?.split('/').pop() || '', // Extract account ID from name
          accountName: account.accountName,
          name: account.name
        });
      }

      return {
        resources: accounts
      };
    } catch (error) {
      console.error('Error listing merchant accounts:', error);
      throw error;
    }
  }

  async registerGcpProject(developerEmail: string): Promise<any> {
    try {
      await this.ensureValidTokens();

      const parent = `accounts/${this.merchantId}`;
      const name = `${parent}/developerRegistration`;

      const request = {
        name: name,
        developerEmail: developerEmail
      };

      console.log('Registering GCP project with request:', request);

      const response = await this.developerRegistrationClient.registerGcp(request);

      console.log('GCP registration successful:', response);
      return response;
    } catch (error) {
      console.error('Error registering GCP project:', error);
      throw error;
    }
  }

  async listDataSources(): Promise<datasourceProtos.google.shopping.merchant.datasources.v1.IDataSource[]> {
    try {
      await this.ensureValidTokens();

      const parent = `accounts/${this.merchantId}`;
      const request = { parent };

      const [dataSources] = await this.dataSourcesClient.listDataSources(request);

      console.log('Found dataSources:', dataSources);

      return dataSources;
    } catch (error) {
      console.error('Error listing data sources:', error);
      throw error;
    }
  }

  async hasApiDataSource(): Promise<boolean> {
    try {
      const dataSources = await this.listDataSources();

      // Verificar si existe algún datasource con input = API (string "API")
      const apiDataSource = dataSources.find(ds =>
        ds.input === 'API' || ds.input === datasourceProtos.google.shopping.merchant.datasources.v1.DataSource.Input.API
      );

      if (apiDataSource) {
        console.log('Found API DataSource:', apiDataSource.name, apiDataSource.displayName);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking API data source:', error);
      throw error;
    }
  }

  async getApiDataSource(): Promise<datasourceProtos.google.shopping.merchant.datasources.v1.IDataSource | null> {
    try {
      const dataSources = await this.listDataSources();

      // Buscar el datasource con input = API
      const apiDataSource = dataSources.find(ds =>
        ds.input === 'API' || ds.input === datasourceProtos.google.shopping.merchant.datasources.v1.DataSource.Input.API
      );

      return apiDataSource || null;
    } catch (error) {
      console.error('Error getting API data source:', error);
      throw error;
    }
  }
}

// Exportar la instancia singleton
export const googleShoppingService = GoogleShoppingService.getInstance();

// También exportar la clase por si alguien necesita el tipo
export { GoogleShoppingService };