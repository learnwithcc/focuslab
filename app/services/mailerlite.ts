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
  private readonly timeout = 15000; // 15 seconds timeout for API calls

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
      this.client = new MailerLite({ 
        api_key: apiKey,
        // Add timeout configuration if supported by the client
        timeout: this.timeout 
      });
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

  /**
   * Wrapper to add timeout to any promise
   */
  private async withTimeout<T>(promise: Promise<T>, operation: string = 'API call'): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`MailerLite ${operation} timed out`)), this.timeout);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }

  public async addSubscriber(email: string, gdprConsent: boolean): Promise<MailerLiteSubscriber> {
    try {
      const client = this.ensureInitialized();
      
      const response = await this.withTimeout(
        client.subscribers.createOrUpdate({
          email,
          status: 'active',
          fields: {
            gdpr_consent: gdprConsent,
            consent_timestamp: new Date().toISOString(),
          },
        }),
        'add subscriber'
      );

      return this.mapApiResponseToSubscriber(response as unknown as MailerLiteApiResponse);
    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Newsletter signup timed out. Please try again later.');
      }
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
      
      const response = await this.withTimeout(
        client.subscribers.find(email),
        'check subscriber'
      );
      
      return !!response.data;
    } catch (error) {
      // Handle timeout errors gracefully
      if (error instanceof Error && error.message.includes('timed out')) {
        console.warn('MailerLite check subscriber timed out');
        return false; // Assume not subscribed on timeout
      }
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
      
      const response = await this.withTimeout(
        client.subscribers.find(email),
        'get subscriber'
      );
      
      return this.mapApiResponseToSubscriber(response as unknown as MailerLiteApiResponse);
    } catch (error) {
      // Handle timeout errors gracefully
      if (error instanceof Error && error.message.includes('timed out')) {
        console.warn('MailerLite get subscriber timed out');
        return null; // Return null on timeout
      }
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
      const response = await this.withTimeout(
        client.subscribers.update(email, { status }),
        'update subscriber status'
      );
      return this.mapApiResponseToSubscriber(response as unknown as MailerLiteApiResponse);
    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Update request timed out. Please try again later.');
      }
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
      await this.withTimeout(
        client.subscribers.delete(email),
        'delete subscriber'
      );
      return true;
    } catch (error) {
      // Handle timeout errors gracefully
      if (error instanceof Error && error.message.includes('timed out')) {
        console.warn('MailerLite delete subscriber timed out');
        return false; // Return false on timeout to allow retry
      }
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

      // Use get instead of getAll/list with timeout
      const response = await this.withTimeout(
        client.subscribers.get(params),
        'list subscribers'
      );
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
      // Handle timeout errors
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Request timed out. Please try again later.');
      }
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

      const response = await this.withTimeout(
        client.subscribers.update(email, updateData),
        'update subscriber data'
      );
      return this.mapApiResponseToSubscriber(response as unknown as MailerLiteApiResponse);
    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Update request timed out. Please try again later.');
      }
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