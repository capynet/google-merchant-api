import {ProductsServiceClient, ProductInputsServiceClient, protos as productProtos} from '@google-shopping/products';
import {AccountsServiceClient, DeveloperRegistrationServiceClient, protos as accountProtos} from '@google-shopping/accounts';
import {DataSourcesServiceClient, protos as datasourceProtos} from '@google-shopping/datasources';
import {oauth2Client, ensureValidTokens} from '../config/oauth';

type IProduct = productProtos.google.shopping.merchant.products.v1.IProduct;
type IProductInput = productProtos.google.shopping.merchant.products.v1.IProductInput;
type IDataSource = datasourceProtos.google.shopping.merchant.datasources.v1.IDataSource;
type IAccount = accountProtos.google.shopping.merchant.accounts.v1.IAccount;

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


    async listProducts(): Promise<IProduct[]> {
        try {
            await ensureValidTokens();
            await this.getMerchantId()

            const parent = `accounts/${this.merchantId}`;
            const request = {parent};

            // @see listProductsAsync() if you want to use auto pagination.
            const [products] = await this.productsClient.listProducts(request);

            return products
        } catch (error) {
            console.error('Error listing products:', error);
            throw error;
        }
    }


    async createProduct(productData: Record<any, any>): Promise<IProduct> {
        try {
            await ensureValidTokens();
            await this.getMerchantId()
            await this.getApiDataSource()

            const parent = `accounts/${this.merchantId}`;
            const dataSourcePath = `accounts/${this.merchantId}/dataSources/${this.dataSourceId}`;

            const productInput: IProductInput = {
                offerId: productData.offerId,
                contentLanguage: productData.contentLang,
                feedLabel: productData.feedLabel,
                productAttributes: {
                    title: productData.title,
                    description: productData.description,
                    link: productData.link,
                    imageLink: productData.imageLink,
                    price: {
                        amountMicros: (parseFloat(productData.price || '0') * 1000000).toString(),
                        currencyCode: productData.currencyCode
                    },
                    brand: productData.brand,
                    condition: productData.condition,
                    availability: productData.availability
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

    async getProduct(offerId: string): Promise<IProduct> {
        try {
            await ensureValidTokens();
            await this.getMerchantId()

            const name = `accounts/${this.merchantId}/products/${offerId}`;
            const request = {name};

            const [product] = await this.productsClient.getProduct(request);
            return product;
        } catch (error) {
            console.error('Error getting product:', error);
            throw error;
        }
    }

    async listMerchantAccounts(): Promise<IAccount[]> {
        try {
            await ensureValidTokens();
            const [accounts] = await this.accountsClient.listAccounts({});
            return accounts;
        } catch (error) {
            console.error('Error listing merchant accounts:', error);
            throw error;
        }
    }

    async listDataSources(): Promise<IDataSource[]> {
        try {
            await ensureValidTokens();
            await this.getMerchantId()

            const parent = `accounts/${this.merchantId}`;
            const request = {parent};

            // @see listDataSourcesAsync() if you want to use auto pagination.
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

            if (!accounts || accounts.length === 0) {
                throw new Error('No merchant accounts found');
            }

            const firstAccount = accounts[0];

            if (!firstAccount.name) {
                throw new Error('Account name not found');
            }

            this.merchantId = firstAccount.accountId as string;

        } catch (error) {
            console.error('Error getting merchant ID:', error);
            throw error;
        }
    }

    /**
     * Adds email as a user for google cloud project with the Merchant API.
     *
     * https://developers.google.com/merchant/api/guides/quickstart#register_your_google_cloud_project
     * This special funcion is reserved for developers. Only needed one time
     * when you create your app (webpage) and the GCP project. Once you
     * enabled Merchant API on your Google console and mapped the domain of
     * your webpage, is necessary a last step to be done via this function to
     * tell to console this email is a developer allowed to use the merchant
     * api.
     * @param developerEmail
     */
    async registerGcpProject(developerEmail: string): Promise<any> {
        try {
            await ensureValidTokens();
            await this.getMerchantId();

            const request = {
                name: `accounts/${this.merchantId}/developerRegistration`,
                developerEmail: developerEmail
            };

            console.log('Registering GCP project with request:', request);

            const res = await this.developerRegistrationClient.registerGcp(request);

            console.log('GCP registration successful:', res);
            return res;
        } catch (error) {
            console.error('Error registering GCP project:', error);
            throw error;
        }
    }

    /**
     * Unregisters the GCP project from the Merchant API.
     */
    async unregisterGcpProject(): Promise<any> {
        try {
            await ensureValidTokens();
            await this.getMerchantId();

            const request = {
                name: `accounts/${this.merchantId}/developerRegistration`
            };

            console.log('Unregistering GCP project with request:', request);

            const res = await this.developerRegistrationClient.unregisterGcp(request);

            console.log('GCP unregistration successful:', res);
            return res;
        } catch (error) {
            console.error('Error unregistering GCP project:', error);
            throw error;
        }
    }

    /**
     * Gets the developer registration information.
     */
    async getDeveloperRegistration(): Promise<any> {
        try {
            await ensureValidTokens();
            await this.getMerchantId();

            const request = {
                name: `accounts/${this.merchantId}/developerRegistration`
            };

            console.log('Getting developer registration with request:', request);

            const res = await this.developerRegistrationClient.getDeveloperRegistration(request);

            console.log('Developer registration info:', res);
            return res;
        } catch (error) {
            console.error('Error getting developer registration:', error);
            throw error;
        }
    }
}

export const googleShoppingService = GoogleShoppingService.getInstance();

export {GoogleShoppingService};