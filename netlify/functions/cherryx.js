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

    // Allow both full URL and path; prefer HTTPS
    let target = urlParam;
    if (!/^https?:\/\//i.test(target)) {
      const base = 'https://main.devnew-app.cherryx.ai';
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

    async function doFetch(url) {
      try {
        const r = await fetch(url, init);
        const ct = r.headers.get('content-type') || '';
        const text = await r.text();
        return { ok: r.ok, status: r.status, text, ct };
      } catch (e) {
        return { ok: false, status: 502, text: JSON.stringify({ error: 'fetch failed', detail: String(e && e.message || e) }), ct: 'application/json' };
      }
    }

    let res1 = await doFetch(target);
    if (!res1.ok && /^https:\/\//i.test(target)) {
      // retry over http if https failed
      try {
        const urlHttp = target.replace(/^https:/i, 'http:');
        const res2 = await doFetch(urlHttp);
        if (res2.ok || res2.status !== 502) res1 = res2;
      } catch (_) {}
    }

    return {
      statusCode: res1.status,
      headers: { ...corsHeaders, 'Content-Type': res1.ct },
      body: res1.text
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Proxy error', detail: String(e && e.message || e) })
    };
  }
};


