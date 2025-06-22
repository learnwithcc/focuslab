import MailerLite from '@mailerlite/mailerlite-nodejs';

// Types for API responses and errors
export interface MailerLiteSubscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'junk' | 'unconfirmed';
  subscribed_at: string;
  ip_address: string | undefined;
  opted_in_at: string | undefined;
  optin_ip: string | undefined;
  fields: {
    gdpr_consent?: boolean;
    consent_timestamp?: string;
    [key: string]: unknown;
  } | undefined;
}

export interface MailerLiteError {
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export interface MailerLiteErrorResponse {
  response?: {
    data?: MailerLiteError;
    status?: number;
  };
}

export interface MailerLiteApiResponse {
  data: {
    id: string;
    email: string;
    status: string;
    subscribed_at: string;
    ip_address?: string;
    opted_in_at?: string;
    optin_ip?: string;
    fields?: {
      gdpr_consent?: boolean;
      consent_timestamp?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

export interface ListSubscribersOptions {
  limit?: number;
  cursor?: string;
  filterBy?: {
    status?: MailerLiteSubscriber['status'];
    consentStatus?: boolean;
  };
}

export interface ListSubscribersResponse {
  subscribers: MailerLiteSubscriber[];
  total: number;
  nextCursor: string | undefined;
}

export class MailerLiteService {
  private client: MailerLite | null = null;
  private static instance: MailerLiteService | null = null;
  private initializationError: string | null = null;

  private constructor() {
    // Don't initialize immediately - wait for first method call
  }

  private initializeClient(): void {
    if (this.client || this.initializationError) {
      return; // Already initialized or failed
    }

    const apiKey = process.env['MAILERLITE_API_KEY'];
    if (!apiKey) {
      this.initializationError = 'MailerLite API key not configured. Please set MAILERLITE_API_KEY environment variable.';
      return;
    }

    try {
      this.client = new MailerLite({ api_key: apiKey });
    } catch (error) {
      this.initializationError = `Failed to initialize MailerLite client: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private ensureInitialized(): MailerLite {
    this.initializeClient();
    
    if (this.initializationError) {
      throw new Error(this.initializationError);
    }
    
    if (!this.client) {
      throw new Error('MailerLite client not properly initialized');
    }
    
    return this.client;
  }

  public static getInstance(): MailerLiteService {
    if (!MailerLiteService.instance) {
      MailerLiteService.instance = new MailerLiteService();
    }
    return MailerLiteService.instance;
  }

  public isConfigured(): boolean {
    this.initializeClient();
    return this.client !== null && this.initializationError === null;
  }

  private mapApiResponseToSubscriber(response: MailerLiteApiResponse): MailerLiteSubscriber {
    const { data } = response;
    return {
      id: data.id,
      email: data.email,
      status: data.status as MailerLiteSubscriber['status'],
      subscribed_at: data.subscribed_at,
      ip_address: data.ip_address,
      opted_in_at: data.opted_in_at,
      optin_ip: data.optin_ip,
      fields: data.fields,
    };
  }

  public async addSubscriber(email: string, gdprConsent: boolean): Promise<MailerLiteSubscriber> {
    try {
      const client = this.ensureInitialized();
      const response = await client.subscribers.createOrUpdate({
        email,
        status: 'active',
        fields: {
          gdpr_consent: gdprConsent,
          consent_timestamp: new Date().toISOString(),
        },
      });

      return this.mapApiResponseToSubscriber(response as unknown as MailerLiteApiResponse);
    } catch (error) {
      // Handle specific API errors
      const mailerLiteError = error as MailerLiteErrorResponse;
      if (mailerLiteError.response?.data) {
        throw new Error(mailerLiteError.response.data.message || 'Failed to add subscriber');
      }
      // Handle network or other errors
      throw new Error('Failed to connect to MailerLite API');
    }
  }

  public async checkSubscriberExists(email: string): Promise<boolean> {
    try {
      const client = this.ensureInitialized();
      const response = await client.subscribers.find(email);
      return !!response.data;
    } catch (error) {
      const mailerLiteError = error as MailerLiteErrorResponse;
      if (mailerLiteError.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get subscriber details by email
   * @param email - The subscriber's email address
   * @returns The subscriber details or null if not found
   */
  public async getSubscriber(email: string): Promise<MailerLiteSubscriber | null> {
    try {
      const client = this.ensureInitialized();
      const response = await client.subscribers.find(email);
      return this.mapApiResponseToSubscriber(response as unknown as MailerLiteApiResponse);
    } catch (error) {
      const mailerLiteError = error as MailerLiteErrorResponse;
      if (mailerLiteError.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update subscriber status (e.g., for unsubscribe)
   * @param email - The subscriber's email address
   * @param status - The new status
   * @returns The updated subscriber details
   */
  public async updateSubscriberStatus(
    email: string,
    status: MailerLiteSubscriber['status']
  ): Promise<MailerLiteSubscriber> {
    try {
      const client = this.ensureInitialized();
      const response = await client.subscribers.update(email, { status });
      return this.mapApiResponseToSubscriber(response as unknown as MailerLiteApiResponse);
    } catch (error) {
      const mailerLiteError = error as MailerLiteErrorResponse;
      if (mailerLiteError.response?.data) {
        throw new Error(mailerLiteError.response.data.message || 'Failed to update subscriber status');
      }
      throw new Error('Failed to connect to MailerLite API');
    }
  }

  /**
   * Delete a subscriber (GDPR right to be forgotten)
   * @param email - The subscriber's email address
   * @returns true if successful, throws error otherwise
   */
  public async deleteSubscriber(email: string): Promise<boolean> {
    try {
      const client = this.ensureInitialized();
      await client.subscribers.delete(email);
      return true;
    } catch (error) {
      const mailerLiteError = error as MailerLiteErrorResponse;
      if (mailerLiteError.response?.status === 404) {
        return true; // Already deleted
      }
      if (mailerLiteError.response?.data) {
        throw new Error(mailerLiteError.response.data.message || 'Failed to delete subscriber');
      }
      throw new Error('Failed to connect to MailerLite API');
    }
  }

  /**
   * List subscribers with pagination and filtering
   * @param options - Listing options (limit, cursor, filters)
   * @returns List of subscribers with pagination info
   */
  public async listSubscribers(options: ListSubscribersOptions = {}): Promise<ListSubscribersResponse> {
    try {
      const client = this.ensureInitialized();
      const { limit = 25, cursor, filterBy } = options;
      const params: Record<string, any> = {
        limit,
        ...(cursor && { cursor }),
        ...(filterBy?.status && { filter: { status: filterBy.status } }),
      };

      // Use get instead of getAll/list
      const response = await client.subscribers.get(params);
      const data = response as unknown as { 
        data: MailerLiteApiResponse['data'][];
        meta: { total: number; next_cursor?: string; }
      };

      return {
        subscribers: data.data.map(subscriber => 
          this.mapApiResponseToSubscriber({ data: subscriber })),
        total: data.meta.total,
        nextCursor: data.meta.next_cursor,
      };
    } catch (error) {
      const mailerLiteError = error as MailerLiteErrorResponse;
      if (mailerLiteError.response?.data) {
        throw new Error(mailerLiteError.response.data.message || 'Failed to list subscribers');
      }
      throw new Error('Failed to connect to MailerLite API');
    }
  }

  /**
   * Update subscriber data (for GDPR data correction requests)
   * @param email - The subscriber's email address
   * @param data - The data to update
   * @returns The updated subscriber details
   */
  public async updateSubscriberData(
    email: string,
    data: {
      fields?: Record<string, unknown>;
      gdprConsent?: boolean;
    }
  ): Promise<MailerLiteSubscriber> {
    try {
      const client = this.ensureInitialized();
      const updateData: Record<string, any> = {
        fields: {
          ...(data.gdprConsent !== undefined && {
            gdpr_consent: data.gdprConsent,
            consent_timestamp: new Date().toISOString(),
          }),
          ...data.fields,
        },
      };

      const response = await client.subscribers.update(email, updateData);
      return this.mapApiResponseToSubscriber(response as unknown as MailerLiteApiResponse);
    } catch (error) {
      const mailerLiteError = error as MailerLiteErrorResponse;
      if (mailerLiteError.response?.data) {
        throw new Error(mailerLiteError.response.data.message || 'Failed to update subscriber data');
      }
      throw new Error('Failed to connect to MailerLite API');
    }
  }
}

// Safe wrapper that handles configuration gracefully
export const mailerLiteService = {
  // Lazy getter for the actual service
  get service() {
    return MailerLiteService.getInstance();
  },

  // Check if the service is properly configured
  isConfigured(): boolean {
    try {
      return this.service.isConfigured();
    } catch {
      return false;
    }
  },

  // Safe wrapper methods that provide helpful error messages
  async addSubscriber(email: string, gdprConsent: boolean): Promise<MailerLiteSubscriber> {
    if (!this.isConfigured()) {
      throw new Error('MailerLite is not configured. Newsletter functionality is currently unavailable.');
    }
    return this.service.addSubscriber(email, gdprConsent);
  },

  async checkSubscriberExists(email: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false; // Safe default when not configured
    }
    return this.service.checkSubscriberExists(email);
  },

  async getSubscriber(email: string): Promise<MailerLiteSubscriber | null> {
    if (!this.isConfigured()) {
      return null; // Safe default when not configured
    }
    return this.service.getSubscriber(email);
  },

  async updateSubscriberStatus(email: string, status: MailerLiteSubscriber['status']): Promise<MailerLiteSubscriber> {
    if (!this.isConfigured()) {
      throw new Error('MailerLite is not configured. Newsletter functionality is currently unavailable.');
    }
    return this.service.updateSubscriberStatus(email, status);
  },

  async deleteSubscriber(email: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return true; // Safe default - assume already deleted when not configured
    }
    return this.service.deleteSubscriber(email);
  },

  async listSubscribers(options: ListSubscribersOptions = {}): Promise<ListSubscribersResponse> {
    if (!this.isConfigured()) {
      throw new Error('MailerLite is not configured. Newsletter functionality is currently unavailable.');
    }
    return this.service.listSubscribers(options);
  },

  async updateSubscriberData(email: string, data: { fields?: Record<string, unknown>; gdprConsent?: boolean; }): Promise<MailerLiteSubscriber> {
    if (!this.isConfigured()) {
      throw new Error('MailerLite is not configured. Newsletter functionality is currently unavailable.');
    }
    return this.service.updateSubscriberData(email, data);
  }
}; 