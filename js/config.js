/*
 * Young Engineers – The Code Quest · configuration
 *
 * API_URL is the public "Web app" URL of your Google Apps Script deployment (see README.md, section
 * "Connect the results sheet"). It looks like:
 *
 *     https://script.google.com/macros/s/AKfycb.../exec
 *
 * This URL is NOT a secret and carries no spreadsheet access: it can only call the two actions that
 * backend/google-apps-script.js allows (begin / submit). Never paste passwords, API keys or a
 * spreadsheet link here.
 *
 * Leave API_URL empty to run in PRACTICE MODE: the quest works, but nothing is sent anywhere and the
 * two-sitting limit is then only enforced on this browser. The app says so on screen.
 */
window.CodeQuestConfig = {
  API_URL: '',
  REQUEST_TIMEOUT_MS: 20000
};
