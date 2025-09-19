# Cherry Pay SDK

A JavaScript SDK for integrating with the Cherry Payment API. This SDK provides a simple interface for user registration, payment processing, and token management.

## Features

- **User Registration**: Register users with email and traffic source
- **Payment Processing**: Initiate payments with various subscription plans
- **Token Management**: Handle redirect tokens and access tokens
- **Complete Payment Flow**: Execute the entire payment process in one method
- **Error Handling**: Comprehensive error handling with detailed messages
- **Browser & Node.js Support**: Works in both browser and Node.js environments

## Installation

Simply include the SDK file in your project:

```html
<script src="cherry-pay-sdk.js"></script>
```

Or for Node.js:
```javascript
const CherryPaySDK = require('./cherry-pay-sdk.js');
```

## Quick Start

### 1. Initialize the SDK

```javascript
const cherrySDK = new CherryPaySDK({
    baseUrl: 'https://dev-newcherry.cherryx.ai',
    apiUrl: 'http://main.devnew-app.cherryx.ai',
    stream: 'xpn_m'
});
```

### 2. Register a User

```javascript
try {
    const result = await cherrySDK.registerUser('user@example.com');
    console.log('User registered:', result);
} catch (error) {
    console.error('Registration failed:', error.message);
}
```

### 3. Complete Payment Flow

```javascript
try {
    const result = await cherrySDK.completePaymentFlow(
        'user@example.com',  // email
        '2',                 // product ID (1 month subscription)
        '1'                  // payment method ID
    );
    
    if (result.success) {
        console.log('Payment flow completed:', result);
    } else {
        console.error('Payment failed:', result.error);
    }
} catch (error) {
    console.error('Flow failed:', error.message);
}
```

## API Reference

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | string | `'https://dev-newcherry.cherryx.ai'` | Base URL for user registration |
| `apiUrl` | string | `'http://main.devnew-app.cherryx.ai'` | API URL for payments and tokens |
| `stream` | string | `'xpn_m'` | Default traffic source |

### Methods

#### `registerUser(email, stream?)`
Register a new user with the Cherry system.

**Parameters:**
- `email` (string): User's email address
- `stream` (string, optional): Traffic source (uses default if not provided)

**Returns:** Promise<object> - Registration response

#### `getRedirectToken()`
Get a redirect token for payment authorization.

**Returns:** Promise<string> - Redirect token

#### `initiatePayment(methodId, productId)`
Initiate a payment transaction.

**Parameters:**
- `methodId` (string): Payment method ID
- `productId` (string): Product ID (see Product Catalog below)

**Returns:** Promise<object> - Payment initiation response

#### `exchangeToken(redirectToken?)`
Exchange a redirect token for an access token.

**Parameters:**
- `redirectToken` (string, optional): Token to exchange (uses stored token if not provided)

**Returns:** Promise<object> - Exchange response with access token

#### `completePaymentFlow(email, productId, methodId?, stream?)`
Execute the complete payment flow in one method.

**Parameters:**
- `email` (string): User's email address
- `productId` (string): Product ID
- `methodId` (string, optional): Payment method ID (default: '1')
- `stream` (string, optional): Traffic source (uses default if not provided)

**Returns:** Promise<object> - Complete flow result

#### `handlePaymentRedirect()`
Handle the redirect from payment completion (extracts token from URL and exchanges it).

**Returns:** Promise<object> - Token exchange result

#### `getProductCatalog()`
Get the available product catalog.

**Returns:** object - Product catalog with IDs and descriptions

#### `getTokens()`
Get currently stored tokens.

**Returns:** object - Object containing `redirectToken` and `accessToken`

#### `clearTokens()`
Clear all stored tokens.

## Product Catalog

| ID | Product |
|----|---------|
| 1 | Trial Subscription (3 days) |
| 2 | Subscription (1 month) |
| 3 | Subscription (3 months) |
| 4 | Subscription (12 months) |
| 5 | Subscription (7 days) |

## Payment Flow

The complete payment flow follows these steps:

1. **User Registration** - Register user with email and traffic source
2. **Get Redirect Token** - Obtain a token for payment authorization
3. **Initiate Payment** - Start the payment process with selected product
4. **Payment Processing** - User completes payment (external)
5. **Handle Redirect** - Process the redirect with token after payment
6. **Token Exchange** - Exchange redirect token for access token

## Error Handling

The SDK includes comprehensive error handling. All methods that make API calls will throw errors that can be caught:

```javascript
try {
    await cherrySDK.registerUser('invalid-email');
} catch (error) {
    console.error('Error:', error.message);
    // Handle error appropriately
}
```

## Test Page

A comprehensive test page (`index.html`) is included that demonstrates all SDK functionality:

- SDK initialization and configuration
- User registration testing
- Token management
- Product selection interface
- Payment initiation
- Complete flow testing
- Token exchange simulation
- Utility functions

To use the test page:

1. Open `index.html` in a web browser
2. Configure SDK settings (URLs and stream)
3. Test individual functions or complete flows
4. Monitor results in the interface

## Browser Compatibility

The SDK uses modern JavaScript features including:
- Fetch API for HTTP requests
- Async/await for promise handling
- ES6 classes and modules

For older browser support, consider using polyfills for:
- `fetch` (for IE/older browsers)
- `Promise` (for IE)

## CORS Considerations

When testing in a browser, you may encounter CORS issues with the API endpoints. For development:

1. Use a CORS browser extension
2. Run a local proxy server
3. Configure the API server to allow cross-origin requests

## License

This SDK is provided as-is for integration with the Cherry Payment API.

## Support

For issues or questions regarding the Cherry Payment API, please contact the API provider.

For SDK-specific issues, please refer to the code comments and test page for guidance.
