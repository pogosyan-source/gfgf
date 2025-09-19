(function(d, w){
  const API_BASE = 'https://dev-newcherry.cherryx.ai';
  const ENDPOINTS = {
    register: API_BASE + '/api/v1/user',
    redirectToken: API_BASE + '/a-api/redirect-token',
    initiatePayment: API_BASE + '/api/v1/payments/initiate',
    exchangeToken: API_BASE + '/a-api/exchange-token'
  };

  const STORAGE = {
    email: 'pw.email',
    stream: 'pw.stream',
    redirectToken: 'pw.redirect_token',
    productId: 'pw.product_id',
    methodId: 'pw.method_id',
    lastInitiate: 'pw.last_initiate_payload',
    accessToken: 'pw.access_token'
  };

  function getQueryParams(){
    try { return Object.fromEntries(new URLSearchParams(w.location.search).entries()); } catch(e){ return {}; }
  }

  function getStream(){
    const qs = getQueryParams();
    return String(qs.stream || 'xpn_m');
  }

  // Прямые вызовы без прокси

  async function jsonRequest(url, method, body, extraHeaders){
    const headers = extraHeaders ? { ...extraHeaders } : {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const options = { method: method || 'GET', credentials: 'include', headers };
    if (body !== undefined) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    return res.json();
  }

  function showInlineError(message){
    const box = d.getElementById('paywall-error') || d.querySelector('.form__item--messages');
    if (box){ box.innerHTML = `<div class="form__error">${String(message||'Ошибка')}</div>`; box.style.display = 'block'; }
    else { console.error(message); }
  }

  async function registerUser(email, stream){
    const payload = { email: String(email||'').trim(), stream: String(stream||getStream()) };
    if (!payload.email) throw new Error('email');
    const resp = await jsonRequest(ENDPOINTS.register, 'POST', payload);
    try {
      const token = resp.access_token || resp.token || resp.result?.access_token || resp.result?.token || '';
      if (token) { try { localStorage.setItem(STORAGE.accessToken, token); } catch(e){} }
    } catch(_){ }
    return resp;
  }

  async function fetchRedirectToken(){
    let authToken = '';
    try { authToken = localStorage.getItem(STORAGE.accessToken) || ''; } catch(_){ }
    const headers = authToken ? { Authorization: 'Bearer ' + authToken } : undefined;
    const resp = await jsonRequest(ENDPOINTS.redirectToken, 'GET', undefined, headers);
    const redirectToken = resp.redirect_token || resp.token || resp.result?.redirect_token || resp.result?.token || resp.result || '';
    if (!redirectToken) throw new Error('Не удалось получить redirect_token');
    return redirectToken;
  }

  async function initiatePayment(methodId, productId){
    const payload = { method_id: String(methodId), product_id: String(productId) };
    let token = '';
    try { token = localStorage.getItem(STORAGE.accessToken) || ''; } catch(_){ }
    const headers = token ? { Authorization: 'Bearer ' + token } : undefined;
    const resp = await jsonRequest(ENDPOINTS.initiatePayment, 'POST', payload, headers);
    const url = resp.redirect || resp.url || resp.result?.redirect || resp.result?.url || '';
    if (!url) throw new Error('Не удалось получить ссылку на оплату');
    try { localStorage.setItem(STORAGE.lastInitiate, JSON.stringify({payload: payload, response: resp})); } catch(e){}
    return url;
  }

  async function exchangeRedirectToken(token){
    const redirectToken = token || (new URLSearchParams(w.location.search).get('redirect_token')) || (function(){ try { return localStorage.getItem(STORAGE.redirectToken) || ''; } catch(e){ return ''; } })();
    if (!redirectToken) throw new Error('redirect_token не найден');
    const resp = await jsonRequest(ENDPOINTS.exchangeToken, 'POST', { redirect_token: redirectToken });
    try { localStorage.setItem(STORAGE.accessToken, JSON.stringify(resp)); } catch(e){}
    return resp;
  }

  async function prepareCheckout(params){
    const email = String(params?.email||'').trim();
    const productId = String(params?.productId || '1');
    const methodId = String(params?.methodId || '1');
    const stream = getStream();

    try { localStorage.setItem(STORAGE.email, email); } catch(e){}
    try { localStorage.setItem(STORAGE.productId, productId); } catch(e){}
    try { localStorage.setItem(STORAGE.methodId, methodId); } catch(e){}
    try { localStorage.setItem(STORAGE.stream, stream); } catch(e){}

    await registerUser(email, stream);
    const token = await fetchRedirectToken();
    try { localStorage.setItem(STORAGE.redirectToken, token); } catch(e){}

    const qs = new URLSearchParams({ product_id: productId, method_id: methodId, email: email, stream: stream, redirect_token: token });
    try {
      const current = new URLSearchParams(w.location.search);
      current.forEach((v,k)=>{ if(!qs.has(k)) qs.set(k,v); });
    } catch(e){}
    w.location.href = 'checkout.html?' + qs.toString();
  }

  async function startCheckout(){
    const qs = new URLSearchParams(w.location.search);
    const productId = qs.get('product_id') || (function(){ try{return localStorage.getItem(STORAGE.productId)||'1';}catch(e){return '1';} })();
    const methodId = qs.get('method_id') || (function(){ try{return localStorage.getItem(STORAGE.methodId)||'1';}catch(e){return '1';} })();

    const payUrl = await initiatePayment(methodId, productId);
    w.location.assign(payUrl);
  }

  function submitRegistration(e){
    if (!e || !e.target) return false;
    e.preventDefault();
    const form = e.target;
    const emailInput = form.elements.emailInput || form.querySelector('input[type="email"]');
    const email = String(emailInput && emailInput.value || '').trim();
    const productEl = form.querySelector('[name="product_id"]');
    const methodEl = form.querySelector('[name="method_id"]');
    const productId = productEl ? String(productEl.value||'1') : '1';
    const methodId = methodEl ? String(methodEl.value||'1') : '1';
    prepareCheckout({ email: email, productId, methodId }).catch(showInlineError);
    return false;
  }

  w.paywall = {
    registerUser,
    fetchRedirectToken,
    initiatePayment,
    exchangeRedirectToken,
    prepareCheckout,
    startCheckout,
    utils: { getStream, getQueryParams, STORAGE }
  };

  w.submitRegistration = submitRegistration;
})(document, window);
