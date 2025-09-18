'use strict';

// Netlify Function: generic proxy to main.cherryx.watch to bypass browser CORS
// Usage: /.netlify/functions/cherryx?path=<FULL_URL_OR_PATH>
// For example: /.netlify/functions/cherryx?path=https%3A%2F%2Fmain.cherryx.watch%2Fapi%2Fv1%2Fuser

const ALLOW_ORIGIN = '*';

exports.handler = async function(event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    const urlParam = (event.queryStringParameters && event.queryStringParameters.path) || '';
    if (!urlParam) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing path param' }) };
    }

    // Allow both full URL and path; default to dev domain over HTTP (to avoid TLS issues)
    let target = urlParam;
    if (!/^https?:\/\//i.test(target)) {
      const base = 'http://main.devnew-app.cherryx.ai';
      target = base.replace(/\/$/, '') + '/' + urlParam.replace(/^\//, '');
    }

    const init = {
      method: event.httpMethod,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      redirect: 'follow'
    };

    if (event.body && event.httpMethod !== 'GET') {
      init.body = event.body;
    }

    const response = await fetch(target, init);
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    const status = response.status;

    return {
      statusCode: status,
      headers: { ...corsHeaders, 'Content-Type': contentType },
      body: text
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Proxy error', detail: String(e && e.message || e) })
    };
  }
};


