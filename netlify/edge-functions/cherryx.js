export default async (request, context) => {
  const url = new URL(request.url);
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: cors });
  }

  const path = url.searchParams.get('path') || '';
  if (!path) {
    return new Response(JSON.stringify({ error: 'Missing path' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }

  const targets = (/^https?:\/\//i.test(path))
    ? [path]
    : [
        'https://main.devnew-app.cherryx.ai/' + path.replace(/^\//, ''),
        'http://main.devnew-app.cherryx.ai/' + path.replace(/^\//, '')
      ];

  const init = {
    method: request.method,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    redirect: 'follow'
  };
  if (request.method !== 'GET') {
    init.body = await request.text();
  }

  for (const t of targets) {
    try {
      const r = await fetch(t, init);
      const body = await r.text();
      return new Response(body, {
        status: r.status,
        headers: { ...cors, 'Content-Type': r.headers.get('content-type') || 'application/json' }
      });
    } catch (_) {
      // try next target (switch scheme)
    }
  }

  return new Response(JSON.stringify({ error: 'fetch failed (edge)' }), {
    status: 502,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
};


