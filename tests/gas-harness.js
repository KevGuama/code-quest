/*
 * Runs the REAL backend/google-apps-script.js inside a Node vm sandbox, with an in-memory stand-in for
 * Google's services (SpreadsheetApp, LockService, ContentService, PropertiesService).
 *
 * This proves the script's logic. It does NOT prove the script works on Google's servers: that needs the
 * live check in tools/live-backend-check.js after you deploy.
 */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

function createBackend(opts) {
  opts = opts || {};
  var sheets = {}; // name -> { rows: [[...]] }
  var log = { errors: [], locks: 0 };

  function Range(sh, r, c, nr, nc) {
    return {
      getValues: function () {
        var out = [];
        for (var i = 0; i < nr; i++) { var row = []; for (var j = 0; j < nc; j++) { var v = (sh.rows[r - 1 + i] || [])[c - 1 + j]; row.push(v === undefined ? '' : v); } out.push(row); }
        return out;
      },
      setValues: function (vals) {
        if (r > 1 && opts.failOnWrite && opts.failOnWrite(sh.name)) throw new Error('simulated write failure');
        for (var i = 0; i < vals.length; i++) { sh.rows[r - 1 + i] = sh.rows[r - 1 + i] || []; for (var j = 0; j < vals[i].length; j++) sh.rows[r - 1 + i][c - 1 + j] = vals[i][j]; }
      },
      setFontWeight: function () { return this; }
    };
  }
  function Sheet(name) {
    var sh = { name: name, rows: [] };
    sh.getName = function () { return name; };
    sh.getLastRow = function () { var n = sh.rows.length; while (n > 0 && (sh.rows[n - 1] || []).every(function (x) { return x === '' || x === undefined; })) n--; return n; };
    sh.getLastColumn = function () { return sh.rows.reduce(function (m, r) { return Math.max(m, (r || []).length); }, 0); };
    sh.getRange = function (r, c, nr, nc) { return Range(sh, r, c, nr || 1, nc || 1); };
    sh.appendRow = function (row) {
      if (opts.failOnWrite && opts.failOnWrite(name)) throw new Error('simulated write failure');
      sh.rows.push(row.slice());
    };
    sh.clearContents = function () { sh.rows = []; };
    sh.setFrozenRows = function () {};
    return sh;
  }
  var spreadsheet = {
    getSheetByName: function (n) { return sheets[n] || null; },
    insertSheet: function (n) { sheets[n] = Sheet(n); return sheets[n]; }
  };

  var held = false;
  var sandbox = {
    console: { log: function () {}, error: function (m) { log.errors.push(String(m)); } },
    SpreadsheetApp: { getActiveSpreadsheet: function () { return spreadsheet; }, openById: function () { return spreadsheet; } },
    PropertiesService: { getScriptProperties: function () { return { getProperty: function () { return null; } }; } },
    LockService: { getScriptLock: function () { return { waitLock: function () { if (held) throw new Error('lock held'); held = true; log.locks++; }, releaseLock: function () { held = false; } }; } },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: function (t) { return { text: t, setMimeType: function () { return this; }, getContent: function () { return this.text; } }; }
    },
    JSON: JSON, Date: Date, Math: Math, String: String, Number: Number, Object: Object, Array: Array, RegExp: RegExp, isFinite: isFinite, Error: Error
  };
  vm.createContext(sandbox);
  var src = fs.readFileSync(path.join(__dirname, '..', 'backend', 'google-apps-script.js'), 'utf8');
  vm.runInContext(src, sandbox, { filename: 'google-apps-script.js' });

  function post(bodyObjOrString) {
    var contents = typeof bodyObjOrString === 'string' ? bodyObjOrString : JSON.stringify(bodyObjOrString);
    var out = sandbox.doPost({ postData: { contents: contents, type: 'text/plain' } });
    return JSON.parse(out.getContent());
  }
  function get() { return JSON.parse(sandbox.doGet({}).getContent()); }
  function table(name) { return sheets[name] ? sheets[name].rows.map(function (r) { return r.slice(); }) : []; }

  sandbox.setup();
  return { post: post, get: get, table: table, sheets: sheets, log: log, sandbox: sandbox };
}

module.exports = { createBackend: createBackend };
