/*
 * Young Engineers – The Code Quest · results client
 * Talks to the Google Apps Script web app. There is deliberately NO fake or simulated success here:
 * if the backend is not configured or not reachable, the caller is told so.
 *
 * Request format: JSON sent as text/plain, which browsers treat as a "simple" request, so there is no
 * CORS preflight (Apps Script web apps cannot answer one). Redirects are followed.
 */
(function () {
  'use strict';
  var cfg = window.CodeQuestConfig || {};

  function configured() {
    var u = cfg.API_URL;
    if (typeof u !== 'string' || !u) return false;
    return /^https:\/\/script\.google\.com\/macros\/s\/[\w\-]+\/exec$/.test(u) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u); // local test server only
  }

  function post(body) {
    if (!configured()) return Promise.resolve({ ok: false, code: 'unconfigured', error: 'Results are not connected.' });
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, cfg.REQUEST_TIMEOUT_MS || 20000) : null;
    return fetch(cfg.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
      cache: 'no-store',
      credentials: 'omit',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) return { ok: false, code: 'http_' + res.status, network: true, error: 'The results server answered with an error (' + res.status + ').' };
      return res.text().then(function (t) {
        try {
          var j = JSON.parse(t);
          if (!j || typeof j !== 'object' || typeof j.ok !== 'boolean') throw new Error('shape');
          return j;
        } catch (e) {
          return { ok: false, code: 'bad_response', network: true, error: 'The results server sent an unexpected reply.' };
        }
      });
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      var timedOut = err && err.name === 'AbortError';
      return { ok: false, code: timedOut ? 'timeout' : 'network', network: true, error: timedOut ? 'The results server took too long to answer.' : 'Could not reach the results server.' };
    });
  }

  window.CodeQuestResults = {
    configured: configured,
    begin: function (name, sitting, token) { return post({ action: 'begin', name: name, sitting: sitting, token: token }); },
    submit: function (payload) { var b = { action: 'submit' }; Object.keys(payload).forEach(function (k) { b[k] = payload[k]; }); return post(b); },
    newToken: function () {
      try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* fall through */ }
      var a = new Uint8Array(16);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256);
      return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    }
  };
})();
