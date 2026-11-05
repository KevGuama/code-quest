/*
 * Local test server. Serves the app and answers POST /exec by running the REAL backend/google-apps-script.js
 * against an in-memory mock of Google Sheets (tests/gas-harness.js).
 *
 *   node tools/dev-server.js [port] [--practice]
 *
 * It is for development and automated tests only. It is NOT part of the deployed site.
 * Admin switches (tests use these):  /__admin/reset  /__admin/state  /__admin/fail?mode=network|500|slow|off
 */
'use strict';
var http = require('http');
var fs = require('fs');
var path = require('path');
var H = require('../tests/gas-harness.js');

var ROOT = path.join(__dirname, '..');
var TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.json': 'application/json' };

function start(port, opts) {
  opts = opts || {};
  var backend = H.createBackend();
  var failMode = 'off';
  var hits = { post: 0 };
  var server = http.createServer(function (req, res) {
    var url = new URL(req.url, 'http://x');
    if (url.pathname === '/__admin/reset') { backend = H.createBackend(); failMode = 'off'; hits.post = 0; return json(res, { ok: true }); }
    if (url.pathname === '/__admin/fail') { failMode = url.searchParams.get('mode') || 'off'; return json(res, { ok: true, failMode: failMode }); }
    if (url.pathname === '/__admin/state') {
      return json(res, { hits: hits, results: backend.table('Assessment Results'), questions: backend.table('Question Performance'), sittings: backend.table('Sittings'), summary: backend.table('Class Summary') });
    }
    if (url.pathname === '/exec') {
      if (req.method === 'GET') return json(res, backend.get());
      var body = '';
      req.on('data', function (c) { body += c; });
      req.on('end', function () {
        hits.post++;
        if (failMode === 'network') return req.socket.destroy();
        if (failMode === '500') { res.writeHead(500); return res.end('boom'); }
        var go = function () { json(res, backend.post(body)); };
        if (failMode === 'slow') return setTimeout(go, 6000);
        go();
      });
      return;
    }
    if (url.pathname === '/js/config.js') {
      res.writeHead(200, { 'Content-Type': TYPES['.js'], 'Cache-Control': 'no-store' });
      return res.end('window.CodeQuestConfig = { API_URL: ' + (opts.practice ? "''" : JSON.stringify('http://127.0.0.1:' + port + '/exec')) + ', REQUEST_TIMEOUT_MS: 3000 };');
    }
    var file = path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (file.indexOf(ROOT) !== 0 || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  function json(res, obj) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
  return new Promise(function (resolve) { server.listen(port, '127.0.0.1', function () { resolve(server); }); });
}

module.exports = { start: start };
if (require.main === module) {
  var port = Number(process.argv[2]) || 8123;
  start(port, { practice: process.argv.indexOf('--practice') !== -1 }).then(function () { console.log('Code Quest dev server: http://127.0.0.1:' + port + '/'); });
}
