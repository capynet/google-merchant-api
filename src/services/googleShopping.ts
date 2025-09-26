import {ProductsServiceClient, ProductInputsServiceClient, protos as productProtos} from '@google-shopping/products';
import {AccountsServiceClient, DeveloperRegistrationServiceClient, protos as accountProtos} from '@google-shopping/accounts';
import {DataSourcesServiceClient, protos as datasourceProtos} from '@google-shopping/datasources';
import {oauth2Client, ensureValidTokens} from '../config/oauth';

type IProduct = productProtos.google.shopping.merchant.products.v1.IProduct;
type IProductInput = productProtos.google.shopping.merchant.products.v1.IProductInput;
type IListProductsResponse = productProtos.google.shopping.merchant.products.v1.IListProductsResponse;
type IDataSource = datasourceProtos.google.shopping.merchant.datasources.v1.IDataSource;
type IAccount = accountProtos.google.shopping.merchant.accounts.v1.IAccount;
type IListAccountsResponse = accountProtos.google.shopping.merchant.accounts.v1.IListAccountsResponse;

export interface ProductData {
    title?: string;
    description?: string;
    link?: string;
    imageLink?: string;
    price?: string;
    brand?: string;
    gtin?: string;
}

class GoogleShoppingService {
    private static instance: GoogleShoppingService;
    private productsClient: ProductsServiceClient;
    private productInputsClient: ProductInputsServiceClient;
    private accountsClient: AccountsServiceClient;
    private developerRegistrationClient: DeveloperRegistrationServiceClient;
    private dataSourcesClient: DataSourcesServiceClient;
    private merchantId: string;
    private dataSourceId: string;

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

    }

    public static getInstance(): GoogleShoppingService {
        if (!GoogleShoppingService.instance) {
            GoogleShoppingService.instance = new GoogleShoppingService();
        }
        return GoogleShoppingService.instance;
    }


    async listProducts(): Promise<IListProductsResponse> {
        try {
            await ensureValidTokens();
            await this.getMerchantId()

            const parent = `accounts/${this.merchantId}`;
            const request = {parent};

            const iterable = this.productsClient.listProductsAsync(request);
            const products: IProduct[] = [];

            for await (const response of iterable) {
                products.push(response);
            }

            return {
                products: products,
                nextPageToken: null  // Pagination not implemented yet
            };
        } catch (error) {
            console.error('Error listing products:', error);
            throw error;
        }
    }


    async createProduct(productData: ProductData): Promise<IProduct> {
        try {
            await ensureValidTokens();
            await this.getMerchantId()
            await this.getApiDataSource()

            // Create a unique product ID (offerId)
            const offerId = `product_${Date.now()}`;
            const parent = `accounts/${this.merchantId}`;

            // Get the first available data source
            const dataSourcePath = `accounts/${this.merchantId}/dataSources/${this.dataSourceId}`;

            const productInput: IProductInput = {
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
                    condition: productProtos.google.shopping.merchant.products.v1.Condition.NEW,
                    availability: productProtos.google.shopping.merchant.products.v1.Availability.IN_STOCK
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

    async getProduct(productId: string): Promise<IProduct> {
        try {
            await ensureValidTokens();
            await this.getMerchantId()

            const name = `accounts/${this.merchantId}/products/${productId}`;
            const request = {name};

            const [response] = await this.productsClient.getProduct(request);
            return response as IProduct;
        } catch (error) {
            console.error('Error getting product:', error);
            throw error;
        }
    }

    async listMerchantAccounts(): Promise<IListAccountsResponse> {
        try {
            await ensureValidTokens();

            const iterable = this.accountsClient.listAccountsAsync({});
            const accounts: IAccount[] = [];

            for await (const account of iterable) {
                accounts.push(account);
            }

            return {
                accounts: accounts,
                nextPageToken: null  // Pagination not implemented yet
            };
        } catch (error) {
            console.error('Error listing merchant accounts:', error);
            throw error;
        }
    }

    async registerGcpProject(developerEmail: string): Promise<any> {
        try {
            await ensureValidTokens();
            await this.getMerchantId()

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

    async listDataSources(): Promise<IDataSource[]> {
        try {
            await ensureValidTokens();
            await this.getMerchantId()

            const parent = `accounts/${this.merchantId}`;
            const request = {parent};

            const [dataSources] = await this.dataSourcesClient.listDataSources(request);

            console.log('Found dataSources:', dataSources);

            return dataSources;
        } catch (error) {
            console.error('Error listing data sources:', error);
            throw error;
        }
    }

    async getApiDataSource(): Promise<void> {
        try {
            const dataSources = await this.listDataSources();

            const apiDataSource: IDataSource | undefined = dataSources.find(ds =>
                ds.input === 'API' || ds.input === datasourceProtos.google.shopping.merchant.datasources.v1.DataSource.Input.API
            );

            if (apiDataSource !== undefined) {
                this.dataSourceId = apiDataSource.dataSourceId as string;
            }


        } catch (error) {
            console.error('Error getting API data source:', error);
            throw error;
        }
    }

    async getMerchantId(): Promise<void> {

        try {
            await ensureValidTokens();

            const accounts = await this.listMerchantAccounts();

            if (!accounts.accounts || accounts.accounts.length === 0) {
                throw new Error('No merchant accounts found');
            }

            const firstAccount = accounts.accounts[0];

            if (!firstAccount.name) {
                throw new Error('Account name not found');
            }

            this.merchantId = firstAccount.accountId as string;

        } catch (error) {
            console.error('Error getting merchant ID:', error);
            throw error;
        }
    }
}

export const googleShoppingService = GoogleShoppingService.getInstance();

export {GoogleShoppingService};