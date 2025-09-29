import {DeveloperRegistrationServiceClient} from '@google-shopping/accounts';

export class GoogleShoppingServiceAdmin {
    private developerRegistrationClient: DeveloperRegistrationServiceClient;
    private merchantId: string;

    private constructor(oauth2Client, merchantId) {
        this.merchantId = merchantId;
        this.developerRegistrationClient = new DeveloperRegistrationServiceClient({
            authClient: oauth2Client
        });

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
