import {ProductsServiceClient, ProductInputsServiceClient, protos as productProtos} from '@google-shopping/products';
import {AccountsServiceClient, protos as accountProtos} from '@google-shopping/accounts';
import {DataSourcesServiceClient, protos as datasourceProtos} from '@google-shopping/datasources';
import {ReportServiceClient, protos as reportsProtos} from '@google-shopping/reports';
import {oauth2Client, ensureValidTokens} from '../config/oauth';

type IProduct = productProtos.google.shopping.merchant.products.v1.IProduct;
type IProductInput = productProtos.google.shopping.merchant.products.v1.IProductInput;
type IDataSource = datasourceProtos.google.shopping.merchant.datasources.v1.IDataSource;
type IAccount = accountProtos.google.shopping.merchant.accounts.v1.IAccount;

// Types for filtered products function
interface FilteredProductOptions {
    // Dynamic filters - any of the filterable fields
    filters?: {
        id?: string | string[];
        offer_id?: string | string[];
        feed_label?: string | string[];
        aggregated_reporting_context_status?: string | string[];
        condition?: string | string[];
        availability?: string | string[];
        channel?: string | string[];
        language_code?: string | string[];
    };

    // Fields to return
    fields?: string[];

    maxResults?: number;
}

interface FilteredProduct {
    id?: string;
    offer_id?: string;
    feed_label?: string;
    title?: string;
    brand?: string;
    condition?: string;
    availability?: string;
    price?: {
        amountMicros?: string;
        currencyCode?: string;
    };
    channel?: string;
    language_code?: string;
    shipping_label?: string;
    item_group_id?: string;
    category_l1?: string;
    category_l2?: string;
    category_l3?: string;
    category_l4?: string;
    category_l5?: string;
    product_type_l1?: string;
    product_type_l2?: string;
    product_type_l3?: string;
    product_type_l4?: string;
    product_type_l5?: string;
    gtin?: string | string[];
    creation_time?: string;
    expiration_date?: string;
    aggregated_reporting_context_status?: string;
    item_issues?: any[];
    click_potential?: string;
    click_potential_rank?: string;
    thumbnail_link?: string;
    [key: string]: any;
}

class GoogleShoppingService {
    private static instance: GoogleShoppingService;
    private productsClient: ProductsServiceClient;
    private productInputsClient: ProductInputsServiceClient;
    private accountsClient: AccountsServiceClient;
    private dataSourcesClient: DataSourcesServiceClient;
    private reportsClient: ReportServiceClient;
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
        this.dataSourcesClient = new DataSourcesServiceClient({
            authClient: oauth2Client
        });
        this.reportsClient = new ReportServiceClient({
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
     * Gets filtered products using the Reports API with SQL-like queries.
     *
     * @param options - Filtering and field selection options
     * @returns Promise<FilteredProduct[]> - Array of products with requested fields
     *
     * FILTERABLE FIELDS (can be used in filters):
     * - id: Product ID
     * - offer_id: Offer ID
     * - feed_label: Feed label
     * - condition: Product condition (NEW, REFURBISHED, USED)
     * - availability: Product availability (IN_STOCK, OUT_OF_STOCK, PREORDER)
     * - channel: Sales channel (ONLINE, LOCAL)
     * - language_code: Language code (en, es, fr, etc.)
     *
     * AVAILABLE FIELDS TO RETURN:
     * - id: Unique product ID
     * - offer_id: Merchant's offer ID
     * - feed_label: Product feed label
     * - title: Product title
     * - brand: Product brand
     * - condition: Product condition
     * - availability: Stock availability
     * - price: Price object with amountMicros and currencyCode
     * - channel: Sales channel
     * - language_code: Content language
     * - shipping_label: Shipping label
     * - item_group_id: Item group identifier
     * - category_l1 to category_l5: Google product category levels
     * - product_type_l1 to product_type_l5: Merchant product type levels
     * - gtin: Global Trade Item Number (barcode)
     * - creation_time: When product was created
     * - expiration_date: Product expiration date
     * - aggregated_reporting_context_status: Overall product status
     * - item_issues: Array of product issues
     * - click_potential: Click potential score
     * - click_potential_rank: Click potential ranking
     * - thumbnail_link: Product thumbnail URL
     *
     * @example
     * // Filter by offer IDs and availability
     * const products = await googleShoppingService.getFilteredProducts({
     *     filters: {
     *         offer_id: ['SKU123', 'SKU456'],
     *         availability: 'IN_STOCK'
     *     },
     *     fields: ['id', 'offer_id', 'title', 'price', 'availability'],
     *     maxResults: 100
     * });
     *
     * @example
     * // Filter by condition and channel
     * const products = await googleShoppingService.getFilteredProducts({
     *     filters: {
     *         condition: 'NEW',
     *         channel: 'ONLINE'
     *     },
     *     fields: ['id', 'title', 'brand', 'price']
     * });
     */
    async getFilteredProducts(options: FilteredProductOptions = {}): Promise<FilteredProduct[]> {
        try {
            await ensureValidTokens();
            await this.getMerchantId();

            const {
                filters = {},
                fields = [
                    'id', 'offer_id', 'feed_label', 'title', 'brand', 'condition', 'availability',
                    'price', 'channel', 'language_code', 'shipping_label', 'item_group_id',
                    'category_l1', 'category_l2', 'category_l3', 'category_l4', 'category_l5',
                    'product_type_l1', 'product_type_l2', 'product_type_l3', 'product_type_l4', 'product_type_l5',
                    'gtin', 'creation_time', 'expiration_date', 'aggregated_reporting_context_status',
                    'item_issues', 'click_potential', 'click_potential_rank', 'thumbnail_link'
                ],
                maxResults = 1000
            } = options;

            const selectFields = fields.join(', ');

            // Build the WHERE clause dynamically
            const whereConditions: string[] = [];

            // Handle dynamic filters
            Object.entries(filters).forEach(([field, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        // Handle array values with IN clause
                        const valueList = value.map(v => `'${v}'`).join(', ');
                        whereConditions.push(`${field} IN (${valueList})`);
                    } else {
                        whereConditions.push(`${field} = '${value}'`);
                    }
                }
            });

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Build the complete query
            const query = `
                SELECT ${selectFields}
                FROM product_view
                ${whereClause}
                LIMIT ${maxResults}
            `.trim();

            const request = {
                parent: `accounts/${this.merchantId}`,
                query: query
            };

            const [results] = await this.reportsClient.search(request);
            const products: FilteredProduct[] = [];

            if (results && results.length > 0) {
                for (const row of results) {
                    console.log('Processing row:', JSON.stringify(row, null, 2));

                    const productData = row.productView || row;

                    const cleanProduct: FilteredProduct = {};

                    fields.forEach(field => {
                        if (productData[field] !== undefined) {
                            cleanProduct[field] = productData[field];
                        }
                    });

                    products.push(cleanProduct);
                }
            }

            return products;

        } catch (error) {
            console.error('Error getting filtered products:', error);
            throw error;
        }
    }
}

export const googleShoppingService = GoogleShoppingService.getInstance();

export {GoogleShoppingService};