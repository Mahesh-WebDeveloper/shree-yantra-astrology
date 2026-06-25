/* Apply persisted theme before first paint to avoid dark-mode flash. */
(function () {
  try {
    var t = localStorage.getItem('sy.theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-sy-theme', t);
    }
  } catch (_) {}
})();
