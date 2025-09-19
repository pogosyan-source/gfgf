/**
 * Cherry Pay SDK - JavaScript SDK for Cherry Payment API
 * 
 * This SDK provides methods to interact with the Cherry Payment API
 * including user registration, payment initiation, and token management.
 */
class CherryPaySDK {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://dev-newcherry.cherryx.ai';
    this.apiUrl = options.apiUrl || 'https://dev-newcherry.cherryx.ai';
    this.stream = options.stream || 'xpn_m';
    this.redirectToken = null;
    this.accessToken = null;
  }

  /**
   * Make HTTP request with proper error handling
   * @param {string} url - Request URL
   * @param {object} options - Fetch options
   * @returns {Promise<object>} Response data
   */
  async makeRequest(url, options = {}) {
    try {
      const { useAuth, headers: extraHeaders, ...fetchOptions } = options;

      const headers = {
        'Content-Type': 'application/json',
        ...(useAuth && this.accessToken ? { 'Authorization': `Bearer ${this.accessToken}` } : {}),
        ...extraHeaders
      };

    const response = await fetch(url, {
      headers,
      credentials: 'include',
      ...fetchOptions
    });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} stream - Traffic source (optional, uses default if not provided)
   * @returns {Promise<object>} Registration response
   */
  async registerUser(email, stream = null) {
    const url = `${this.baseUrl}/api/v1/user`;
    const body = {
      email: email,
      stream: stream || this.stream
    };

    const response = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    // Try to persist access token returned by registration
    if (response && typeof response === 'object') {
      const possibleAccessToken =
        response.access_token ||
        response.accessToken ||
        response.token ||
        (response.data && (response.data.access_token || response.data.accessToken || response.data.token));
      if (possibleAccessToken) {
        this.accessToken = possibleAccessToken;
      }
    }

    console.log('User registered successfully:', response);
    return response;
  }

  /**
   * Get redirect token for authorization
   * @returns {Promise<string>} Redirect token
   */
  async getRedirectToken() {
    const url = `${this.apiUrl}/a-api/redirect-token`;

    const response = await this.makeRequest(url, {
      method: 'GET',
      useAuth: true
    });

    // Extract token from common API shapes
    const t = (typeof response === 'string') ? response : (
      response?.redirect_token || response?.token || response?.redirectToken ||
      response?.data?.redirect_token || response?.data?.token || response?.result?.redirect_token || response?.result?.token
    );
    this.redirectToken = t || null;
    console.log('Redirect token obtained:', this.redirectToken);
    return this.redirectToken;
  }

  /**
   * Initiate payment
   * @param {string} methodId - Payment method ID
   * @param {string} productId - Product ID (1-5)
   * @returns {Promise<object>} Payment initiation response
   */
  async initiatePayment(methodId, productId) {
    const url = `${this.apiUrl}/api/v1/payments/initiate`;
    const body = {
      method_id: methodId,
      product_id: productId
    };

    const response = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      useAuth: true
    });

    console.log('Payment initiated:', response);
    return response;
  }

  /**
   * Exchange redirect token for access token
   * @param {string} redirectToken - Redirect token from URL
   * @returns {Promise<object>} Exchange response with access token
   */
  async exchangeToken(redirectToken = null) {
    const url = `${this.apiUrl}/a-api/exchange-token`;
    const tokenToExchange = redirectToken || this.redirectToken;

    if (!tokenToExchange) {
      throw new Error('No redirect token available for exchange');
    }

    const body = {
      redirect_token: tokenToExchange
    };

    const response = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    // Store access token if returned
    if (response && typeof response === 'object') {
      const possibleAccessToken =
        response.access_token ||
        response.accessToken ||
        response.token ||
        (response.data && (response.data.access_token || response.data.accessToken || response.data.token));
      if (possibleAccessToken) {
        this.accessToken = possibleAccessToken;
      }
    }

    console.log('Token exchanged successfully:', response);
    return response;
  }

  /**
   * Get product information
   * @returns {object} Product catalog
   */
  getProductCatalog() {
    return {
      '1': 'Trial Subscription (3 дня)',
      '2': 'Subscription (1 месяц)',
      '3': 'Subscription (3 месяца)',
      '4': 'Subscription (12 месяцев)',
      '5': 'Subscription (7 дней)'
    };
  }

  /**
   * Complete payment flow
   * @param {string} email - User email
   * @param {string} productId - Product ID
   * @param {string} methodId - Payment method ID
   * @param {string} stream - Traffic source (optional)
   * @returns {Promise<object>} Complete flow result
   */
  async completePaymentFlow(email, productId, methodId = '1', stream = null) {
    try {
      // Step 1: Register user
      const registrationResult = await this.registerUser(email, stream);

      // Step 2: Get redirect token
      const redirectToken = await this.getRedirectToken();

      // Step 3: Initiate payment
      const paymentResult = await this.initiatePayment(methodId, productId);

      return {
        success: true,
        registration: registrationResult,
        redirectToken: redirectToken,
        payment: paymentResult,
        message: 'Payment flow initiated successfully. User will be redirected after payment completion.'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Payment flow failed'
      };
    }
  }

  /**
   * Handle redirect from payment
   * Extract redirect token from URL and exchange it for access token
   * @returns {Promise<object>} Token exchange result
   */
  async handlePaymentRedirect() {
    try {
      // Get redirect_token from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const redirectToken = urlParams.get('redirect_token');

      if (!redirectToken) {
        throw new Error('No redirect token found in URL');
      }

      // Exchange token for access token
      const exchangeResult = await this.exchangeToken(redirectToken);

      return {
        success: true,
        result: exchangeResult,
        message: 'User successfully authorized'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to handle payment redirect'
      };
    }
  }

  /**
   * Get current tokens
   * @returns {object} Current tokens
   */
  getTokens() {
    return {
      redirectToken: this.redirectToken,
      accessToken: this.accessToken
    };
  }

  /**
   * Clear stored tokens
   */
  clearTokens() {
    this.redirectToken = null;
    this.accessToken = null;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CherryPaySDK;
} else if (typeof window !== 'undefined') {
  window.CherryPaySDK = CherryPaySDK;
}
