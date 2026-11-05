/*
 * Young Engineers – The Code Quest
 * Small inline SVG illustrations (rocket, robot, gear, circuit chip).
 * All strings here are static and trusted; no student input is ever used.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CodeQuestArt = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var INK = '#2f2e47';

  function rocket(extraClass) {
    return (
      '<svg class="art-rocket ' + (extraClass || '') + '" viewBox="0 0 120 170" aria-hidden="true" focusable="false">' +
      '<g class="rocket-flame">' +
      '<path d="M48 122 Q60 172 72 122 Z" fill="#f6a04d"/>' +
      '<path d="M53 122 Q60 152 67 122 Z" fill="#ffd36e"/>' +
      '</g>' +
      '<path d="M36 100 L16 134 L40 124 Z" fill="#e0553a" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M84 100 L104 134 L80 124 Z" fill="#e0553a" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M60 8 C88 36 92 84 85 124 H35 C28 84 32 36 60 8 Z" fill="#fff" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M60 8 C71 19 77 30 80 44 H40 C43 30 49 19 60 8 Z" fill="#e0553a" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="60" cy="72" r="15" fill="#7fa3ab" stroke="' + INK + '" stroke-width="4"/>' +
      '<circle cx="55" cy="67" r="4" fill="#fff" opacity=".7"/>' +
      '<rect x="44" y="104" width="32" height="8" rx="4" fill="#d9b78a" stroke="' + INK + '" stroke-width="3"/>' +
      '</svg>'
    );
  }

  function robot(mood, extraClass) {
    var mouths = {
      happy: '<path d="M47 63 Q60 75 73 63" fill="none" stroke="#8ff0e0" stroke-width="4" stroke-linecap="round"/>',
      think: '<path d="M50 66 H70" fill="none" stroke="#8ff0e0" stroke-width="4" stroke-linecap="round"/>',
      party: '<path d="M46 60 Q60 82 74 60 Z" fill="#8ff0e0" stroke="#8ff0e0" stroke-width="3" stroke-linejoin="round"/>',
      oops: '<path d="M48 70 Q60 60 72 70" fill="none" stroke="#8ff0e0" stroke-width="4" stroke-linecap="round"/>'
    };
    var m = mouths[mood] ? mood : 'happy';
    var eyes = m === 'party'
      ? '<path d="M41 54 Q47 46 53 54" fill="none" stroke="#8ff0e0" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M67 54 Q73 46 79 54" fill="none" stroke="#8ff0e0" stroke-width="4" stroke-linecap="round"/>'
      : '<circle cx="47" cy="52" r="6" fill="#8ff0e0"/><circle cx="73" cy="52" r="6" fill="#8ff0e0"/>';
    return (
      '<svg class="art-robot robot-' + m + ' ' + (extraClass || '') + '" viewBox="0 0 120 132" aria-hidden="true" focusable="false">' +
      '<line x1="60" y1="10" x2="60" y2="26" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
      '<circle class="robot-antenna" cx="60" cy="9" r="6" fill="#ffc857" stroke="' + INK + '" stroke-width="3"/>' +
      '<rect x="14" y="42" width="10" height="24" rx="5" fill="#d9b78a" stroke="' + INK + '" stroke-width="3"/>' +
      '<rect x="96" y="42" width="10" height="24" rx="5" fill="#d9b78a" stroke="' + INK + '" stroke-width="3"/>' +
      '<rect x="22" y="26" width="76" height="62" rx="22" fill="#7fa3ab" stroke="' + INK + '" stroke-width="4"/>' +
      '<rect x="31" y="36" width="58" height="42" rx="15" fill="' + INK + '"/>' +
      eyes + mouths[m] +
      '<rect x="36" y="92" width="48" height="34" rx="12" fill="#d9b78a" stroke="' + INK + '" stroke-width="4"/>' +
      '<circle cx="60" cy="109" r="7" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
      '<circle cx="60" cy="109" r="2.5" fill="#e0553a"/>' +
      '</svg>'
    );
  }

  /* Gear: a thick dashed circle gives the "teeth" */
  function gear(extraClass, color) {
    var c = color || '#d9b78a';
    return (
      '<svg class="art-gear ' + (extraClass || '') + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<circle cx="50" cy="50" r="38" fill="none" stroke="' + c + '" stroke-width="13" stroke-dasharray="14.9 14.9"/>' +
      '<circle cx="50" cy="50" r="32" fill="' + c + '"/>' +
      '<circle cx="50" cy="50" r="13" fill="rgba(47,46,71,.35)"/>' +
      '</svg>'
    );
  }

  function chip(extraClass) {
    return (
      '<svg class="art-chip ' + (extraClass || '') + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<g stroke="#a3b5a0" stroke-width="5" stroke-linecap="round">' +
      '<path d="M30 8v16M50 8v16M70 8v16M30 76v16M50 76v16M70 76v16M8 30h16M8 50h16M8 70h16M76 30h16M76 50h16M76 70h16"/>' +
      '</g>' +
      '<rect x="22" y="22" width="56" height="56" rx="12" fill="#6f6a94" stroke="' + INK + '" stroke-width="4"/>' +
      '<text x="50" y="57" text-anchor="middle" font-family="ui-monospace,Consolas,monospace" font-size="22" font-weight="700" fill="#fff">&lt;/&gt;</text>' +
      '</svg>'
    );
  }

  /* Small brand mark for the top bar */
  function brandMark() {
    return (
      '<svg class="art-brand" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<circle cx="24" cy="24" r="18" fill="none" stroke="#d9b78a" stroke-width="7" stroke-dasharray="7.1 7.1"/>' +
      '<circle cx="24" cy="24" r="15" fill="#6f6a94"/>' +
      '<path d="M24 12 C32 19 33 29 31 35 H17 C15 29 16 19 24 12 Z" fill="#fff"/>' +
      '<circle cx="24" cy="25" r="4" fill="#7fa3ab"/>' +
      '<path d="M17 35 L13 40 L19 37 Z M31 35 L35 40 L29 37 Z" fill="#e0553a"/>' +
      '</svg>'
    );
  }

  function faviconSvg() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="14" fill="#2f2e47"/>' +
      '<path d="M32 9 C44 20 46 36 43 46 H21 C18 36 20 20 32 9 Z" fill="#fff"/>' +
      '<path d="M32 9 C37 14 40 19 41 25 H23 C24 19 27 14 32 9 Z" fill="#e0553a"/>' +
      '<circle cx="32" cy="33" r="6" fill="#7fa3ab"/>' +
      '<path d="M21 46 L14 56 L25 51 Z M43 46 L50 56 L39 51 Z" fill="#ffc857"/>' +
      '</svg>'
    );
  }

  return { rocket: rocket, robot: robot, gear: gear, chip: chip, brandMark: brandMark, faviconSvg: faviconSvg };
});
