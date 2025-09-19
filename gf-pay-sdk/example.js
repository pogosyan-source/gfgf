/**
 * Cherry Pay SDK Usage Example
 * 
 * This example demonstrates how to use the Cherry Pay SDK
 * for integrating payment functionality into your application.
 */

// Import the SDK (for Node.js)
// const CherryPaySDK = require('./cherry-pay-sdk.js');

// For browser usage, include the script tag in your HTML:
// <script src="cherry-pay-sdk.js"></script>

// Initialize the SDK
const cherrySDK = new CherryPaySDK({
  baseUrl: 'https://dev-newcherry.cherryx.ai',
  apiUrl: 'https://dev-newcherry.cherryx.ai',
  stream: 'xpn_m'
});

// Example 1: Simple user registration
async function exampleRegistration() {
  try {
    console.log('Registering user...');
    const result = await cherrySDK.registerUser('user@example.com');
    console.log('✅ Registration successful:', result);
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
  }
}

// Example 2: Complete payment flow
async function examplePaymentFlow() {
  try {
    console.log('Starting complete payment flow...');

    const result = await cherrySDK.completePaymentFlow(
      'customer@example.com',  // User email
      '2',                     // Product ID (1 month subscription)
      '1',                     // Payment method ID
      'my_landing_page'        // Custom traffic source
    );

    if (result.success) {
      console.log('✅ Payment flow completed successfully!');
      console.log('Registration:', result.registration);
      console.log('Redirect Token:', result.redirectToken);
      console.log('Payment:', result.payment);
    } else {
      console.error('❌ Payment flow failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Payment flow error:', error.message);
  }
}

// Example 3: Step-by-step payment process
async function exampleStepByStep() {
  try {
    console.log('Step 1: Register user');
    await cherrySDK.registerUser('stepuser@example.com');

    console.log('Step 2: Get redirect token');
    const redirectToken = await cherrySDK.getRedirectToken();
    console.log('Got redirect token:', redirectToken);

    console.log('Step 3: Initiate payment');
    const payment = await cherrySDK.initiatePayment('1', '1'); // Trial subscription
    console.log('Payment initiated:', payment);

    // At this point, the user would be redirected to payment processor
    // After successful payment, they would return with the redirect token

    console.log('Step 4: Exchange token (simulated)');
    const exchangeResult = await cherrySDK.exchangeToken(redirectToken);
    console.log('✅ Token exchanged:', exchangeResult);

  } catch (error) {
    console.error('❌ Step-by-step process failed:', error.message);
  }
}

// Example 4: Handle payment redirect (for browser environment)
async function exampleHandleRedirect() {
  try {
    // This would typically be called when user returns from payment
    console.log('Handling payment redirect...');
    const result = await cherrySDK.handlePaymentRedirect();

    if (result.success) {
      console.log('✅ User successfully authorized!');
      console.log('Access token received');

      // Now the user can access protected resources
      const tokens = cherrySDK.getTokens();
      console.log('Current tokens:', tokens);
    } else {
      console.error('❌ Redirect handling failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Redirect error:', error.message);
  }
}

// Example 5: Product catalog usage
function exampleProductCatalog() {
  console.log('Available products:');
  const products = cherrySDK.getProductCatalog();

  Object.entries(products).forEach(([id, name]) => {
    console.log(`  ${id}: ${name}`);
  });
}

// Example 6: Error handling patterns
async function exampleErrorHandling() {
  try {
    // Attempt registration with invalid email
    await cherrySDK.registerUser('invalid-email');
  } catch (error) {
    if (error.message.includes('HTTP 400')) {
      console.log('Validation error - check email format');
    } else if (error.message.includes('HTTP 500')) {
      console.log('Server error - try again later');
    } else {
      console.log('Network or other error:', error.message);
    }
  }
}

// Example 7: Token management
async function exampleTokenManagement() {
  // Get current tokens
  let tokens = cherrySDK.getTokens();
  console.log('Initial tokens:', tokens);

  // Get a redirect token
  await cherrySDK.getRedirectToken();

  // Check tokens again
  tokens = cherrySDK.getTokens();
  console.log('After getting redirect token:', tokens);

  // Clear tokens
  cherrySDK.clearTokens();

  // Check tokens after clearing
  tokens = cherrySDK.getTokens();
  console.log('After clearing:', tokens);
}

// Run examples (uncomment the ones you want to test)
async function runExamples() {
  console.log('🍒 Cherry Pay SDK Examples\n');

  // Show available products
  exampleProductCatalog();
  console.log('');

  // Uncomment to run specific examples:

  // await exampleRegistration();
  // console.log('');

  // await examplePaymentFlow();
  // console.log('');

  // await exampleStepByStep();
  // console.log('');

  // await exampleTokenManagement();
  // console.log('');

  // await exampleErrorHandling();
  // console.log('');

  console.log('Examples completed! Open index.html for interactive testing.');
}

// Run examples if this file is executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  // Node.js environment
  runExamples().catch(console.error);
} else {
  // Browser environment - examples available as functions
  console.log('Cherry Pay SDK examples loaded. Call runExamples() to test.');
}
