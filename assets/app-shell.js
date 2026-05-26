/* ============================================================
   Shree Yantra — App Shell
   - Side drawer (slide-in menu) wired to any hamburger / menu btn
   - Auto-injects a bottom nav when the page doesn't ship one
   - Routes EVERY known nav target to its page
   - Marks the current bottom-nav item as active
   ============================================================ */
(function () {
  if (window.__syShellLoaded) return;
  window.__syShellLoaded = true;

  // --- Compute path to the /pages/ root so links work from any subdir ---
  var here = location.pathname.replace(/\\/g, "/");
  var pagesRoot;
  var marker = "/pages/";
  var idx = here.indexOf(marker);
  if (idx >= 0) {
    pagesRoot = here.slice(0, idx + marker.length);
  } else {
    // Root index — assume pages live in ./pages/
    pagesRoot = here.replace(/\/[^/]*$/, "/") + "pages/";
  }

  function pageUrl(folder) {
    return pagesRoot + folder + "/index.html";
  }
  function go(folder) { location.href = pageUrl(folder); }

  // ============================================================
  // Page route map — every named destination resolves to a folder
  // ============================================================
  var ROUTES = {
    splash:                 "splash",
    onboarding:             "onboarding",
    signin:                 "signin",
    register:               "register",
    welcome:                "welcome-page",
    home:                   "welcome-page",
    choghadiya:             "choghadiya",
    library:                "library",
    "daily-prediction":     "daily-predication-page",
    predictions:            "predictions",
    kundli:                 "kundli",
    remedies:               "remedies",
    services:               "services",
    profile:                "profile-page",
    subscribenow:           "subscribenow-page",
    subscribe:              "subscribenow-page",
    "manage-subscription":  "manage-subscription",
    "subscription-activated": "subscription-activated",
    "edit-profile":         "edit-profile",
    notifications:          "notifications",
    help:                   "help"
  };

  function navTo(name) {
    var folder = ROUTES[name];
    if (folder) go(folder);
  }
  window.SY = window.SY || {};
  window.SY.go = navTo;

  // ============================================================
  // localStorage helpers — persist user state across pages
  // ============================================================
  var STORE_KEY = 'sy.user.v1';
  function getUser() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (_) { return {}; }
  }
  function setUser(patch) {
    var u = getUser();
    Object.keys(patch || {}).forEach(function (k) { u[k] = patch[k]; });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(u)); } catch (_) {}
    return u;
  }
  function clearUser() {
    try { localStorage.removeItem(STORE_KEY); } catch (_) {}
  }
  window.SY.getUser = getUser;
  window.SY.setUser = setUser;
  window.SY.clearUser = clearUser;

  // ============================================================
  // TOAST — non-blocking notifications
  //   SY.toast("Saved")          // default
  //   SY.toast("Error", "error") // error variant
  // ============================================================
  function toast(message, variant) {
    var el = document.querySelector('.sy-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'sy-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.remove('show', 'sy-toast--error', 'sy-toast--success');
    if (variant === 'error') el.classList.add('sy-toast--error');
    else if (variant === 'success') el.classList.add('sy-toast--success');
    // force reflow
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }
  window.SY.toast = toast;

  // ============================================================
  // CONFIRM MODAL — promise-style confirmation
  //   SY.confirm({title, message, confirmLabel, cancelLabel, variant})
  //     .then(ok => ok && doIt())
  // ============================================================
  function confirmModal(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var existing = document.querySelector('.sy-modal');
      if (existing) existing.remove();

      var wrap = document.createElement('div');
      wrap.className = 'sy-modal' + (opts.variant === 'danger' ? ' sy-modal--danger' : '');
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-modal', 'true');
      wrap.innerHTML =
        '<div class="sy-modal__backdrop" data-close></div>' +
        '<div class="sy-modal__panel" tabindex="-1">' +
          (opts.title ? '<h3 class="sy-modal__title">' + opts.title + '</h3>' : '') +
          (opts.message ? '<p class="sy-modal__msg">' + opts.message + '</p>' : '') +
          '<div class="sy-modal__actions">' +
            '<button class="sy-btn sy-btn--ghost" data-action="cancel">' + (opts.cancelLabel || 'CANCEL') + '</button>' +
            '<button class="sy-btn ' + (opts.variant === 'danger' ? 'sy-btn--danger' : 'sy-btn--primary') + '" data-action="confirm">' + (opts.confirmLabel || 'CONFIRM') + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(wrap);
      document.body.classList.add('sy-no-scroll');
      requestAnimationFrame(function () { wrap.classList.add('open'); });

      function close(result) {
        wrap.classList.remove('open');
        document.body.classList.remove('sy-no-scroll');
        setTimeout(function () {
          wrap.remove();
          resolve(result);
        }, 200);
      }
      wrap.addEventListener('click', function (e) {
        var t = e.target;
        if (t.hasAttribute('data-close') || t.getAttribute('data-action') === 'cancel') close(false);
        else if (t.getAttribute('data-action') === 'confirm') close(true);
      });
      function onKey(e) {
        if (e.key === 'Escape') { close(false); window.removeEventListener('keydown', onKey); }
        else if (e.key === 'Enter') { close(true); window.removeEventListener('keydown', onKey); }
      }
      window.addEventListener('keydown', onKey);
      wrap.querySelector('.sy-modal__panel').focus();
    });
  }
  window.SY.confirm = confirmModal;

  // ============================================================
  // FORM VALIDATION
  //   Mark a .sy-field with data-required, data-email or data-min="N".
  //   SY.validateForm(formEl) returns true if all pass and applies
  //   .is-invalid to failing fields.
  // ============================================================
  function validateField(field) {
    var input = field.querySelector('input, select, textarea');
    if (!input) return true;
    var v = (input.value || '').trim();
    var bad = false;
    if (field.hasAttribute('data-required') && !v) bad = true;
    if (!bad && field.hasAttribute('data-email') && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) bad = true;
    if (!bad && field.hasAttribute('data-min') && v.length < parseInt(field.getAttribute('data-min'), 10)) bad = true;
    field.classList.toggle('is-invalid', bad);
    return !bad;
  }
  function validateForm(form) {
    var fields = form.querySelectorAll('.sy-field');
    var ok = true;
    fields.forEach(function (f) { if (!validateField(f)) ok = false; });
    return ok;
  }
  // Live-clear errors as user types
  document.addEventListener('input', function (e) {
    var f = e.target.closest && e.target.closest('.sy-field.is-invalid');
    if (f) validateField(f);
  });
  window.SY.validateField = validateField;
  window.SY.validateForm = validateForm;

  // ============================================================
  // Which page are we on? (used to mark active items)
  // ============================================================
  var currentFolder = (function () {
    var m = here.match(/\/pages\/([^/]+)\//);
    return m ? m[1] : "";
  })();
  var currentKey = Object.keys(ROUTES).find(function (k) { return ROUTES[k] === currentFolder; }) || "home";

  // ============================================================
  // DRAWER
  // ============================================================
  // Current language (persisted in localStorage)
  var LANG_KEY = 'sy.lang';
  function getLang() {
    try { return localStorage.getItem(LANG_KEY) || 'en'; } catch (_) { return 'en'; }
  }
  function setLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    document.documentElement.setAttribute('lang', lang);
    // refresh active state on drawer language buttons
    document.querySelectorAll('.sy-drawer__lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
  }
  window.SY.getLang = getLang;
  window.SY.setLang = setLang;

  var drawerHTML =
    '<div class="sy-drawer-backdrop" data-sy-drawer-close></div>' +
    '<aside class="sy-drawer" role="dialog" aria-label="Menu">' +
      '<div class="sy-drawer__head">' +
        '<button class="sy-drawer__close" data-sy-drawer-close aria-label="Close menu">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>' +
        '</button>' +
        '<div class="sy-drawer__brand">' +
          '<div class="sy-drawer__logo" aria-label="Om">' +
            '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
              '<g fill="#2a1c00">' +
                '<path d="M48 38c-9 0-15 5-15 13 0 7 5 12 12 12 4 0 7-2 8-5l-3-2c-1 2-3 3-5 3-3 0-6-3-6-7s3-7 8-7c7 0 12 6 12 13s-6 14-15 14-16-7-16-16c0-3 .6-6 2-9l-4-2c-1.6 3.6-2.5 7.2-2.5 11 0 12 8.6 21 20.5 21 11.6 0 20-9 20-20 0-11-7.5-19-16-19z"/>' +
                '<path d="M68 38c-2 0-4 1-5 3l3 2c.5-1 1.5-1.5 2.5-1.5 2 0 3 1.5 3 4 0 3-2 5-5 5l1 4c5 0 9-3 9-9 0-4.5-3-7.5-8.5-7.5z"/>' +
                '<path d="M50 22c5 0 9 1 12 4l-2 2c-2-2-6-3-10-3z"/>' +
                '<circle cx="50" cy="16" r="3.2"/>' +
              '</g>' +
            '</svg>' +
          '</div>' +
          '<div>' +
            '<div class="sy-drawer__title">SHREE YANTRA</div>' +
            '<div class="sy-drawer__sub">ASTROLOGY</div>' +
          '</div>' +
        '</div>' +
        '<div class="sy-drawer__user">Namaste, <span data-sy-firstname>Raj</span> <span class="sy-drawer__user-badge">Premium</span></div>' +
      '</div>' +
      '<div class="sy-drawer__lang" role="group" aria-label="Language">' +
        '<div class="sy-drawer__lang-label">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>' +
          '<span>Language / भाषा</span>' +
        '</div>' +
        '<div class="sy-drawer__lang-row">' +
          '<button class="sy-drawer__lang-btn" data-lang="en" type="button"><span class="lang-glyph">EN</span> English</button>' +
          '<button class="sy-drawer__lang-btn" data-lang="hi" type="button"><span class="lang-glyph">हि</span> हिंदी</button>' +
        '</div>' +
      '</div>' +
      '<ul class="sy-drawer__list">' +
        drawerItem('home',              'Home',                iconHome()) +
        drawerItem('daily-prediction',  'Daily Prediction',    iconStar()) +
        drawerItem('choghadiya',        'Choghadiya',          iconClock()) +
        drawerItem('library',           'Divine Library',      iconBook()) +
        drawerItem('kundli',            'Kundli / Birth Chart', iconChart()) +
        drawerItem('remedies',          'Remedies & Upay',     iconFlame()) +
        drawerItem('services',          'Astrologer Services', iconChat()) +
        '<div class="sy-drawer__divider"></div>' +
        drawerItem('profile',           'My Profile',          iconUser()) +
        drawerItem('notifications',     'Notifications',       iconBell()) +
        drawerItem('manage-subscription','Manage Subscription', iconCrown()) +
        drawerItem('help',              'Help & Support',      iconHelp()) +
        drawerItem('signin',            'Logout',              iconLogout()) +
      '</ul>' +
      '<div class="sy-drawer__foot">SHREE YANTRA · ASTROLOGY v1.0</div>' +
    '</aside>';

  function drawerItem(key, label, svg) {
    var activeCls = key === currentKey ? ' active' : '';
    return '<li><button class="sy-drawer__item' + activeCls + '" data-sy-go="' + key + '">' + svg + '<span>' + label + '</span></button></li>';
  }

  function iconHome()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'; }
  function iconStar()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'; }
  function iconSparkle(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>'; }
  function iconClock()  { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M7 2.8 4.8 5M17 2.8 19.2 5"/></svg>'; }
  function iconBook()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/><path d="M8 6h8"/></svg>'; }
  function iconChart()  { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18"/><line x1="3" y1="3" x2="21" y2="21"/><line x1="21" y1="3" x2="3" y2="21"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>'; }
  function iconFlame()  { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C9 6 7 8 7 12a5 5 0 0 0 10 0c0-2-1-4-3-6-1 2-2 2-2 0z"/></svg>'; }
  function iconChat()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'; }
  function iconUser()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'; }
  function iconCrown()  { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8l4 6 5-8 5 8 4-6-2 12H4z"/></svg>'; }
  function iconHelp()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'; }
  function iconBell()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>'; }
  function iconLogout() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'; }

  function openDrawer() {
    document.body.classList.add('sy-no-scroll');
    document.querySelector('.sy-drawer').classList.add('open');
    document.querySelector('.sy-drawer-backdrop').classList.add('open');
  }
  function closeDrawer() {
    document.body.classList.remove('sy-no-scroll');
    var d = document.querySelector('.sy-drawer');
    var b = document.querySelector('.sy-drawer-backdrop');
    if (d) d.classList.remove('open');
    if (b) b.classList.remove('open');
  }
  window.SY.openDrawer = openDrawer;
  window.SY.closeDrawer = closeDrawer;

  // ============================================================
  // BOTTOM NAV (auto-injected unless page ships .bottom-nav-wrap)
  // ============================================================
  // Refined themed nav icons — same 24x24 viewBox, consistent 1.6 stroke
  function navIconHome() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
             '<path d="M3.2 11.6 12 4l8.8 7.6"/>' +
             '<path d="M5 10.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9.5"/>' +
             '<circle cx="12" cy="9" r="0.9" fill="currentColor"/>' +
           '</svg>';
  }
  function navIconPredictions() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
             '<path d="M12 2.5 14 8l5.6.7-4.1 3.9 1.1 5.6L12 15.4l-4.6 2.8L8.5 12.6 4.4 8.7 10 8z" fill="currentColor" fill-opacity=".18"/>' +
             '<circle cx="19" cy="5"  r="0.9" fill="currentColor"/>' +
             '<circle cx="5"  cy="6"  r="0.7" fill="currentColor"/>' +
             '<circle cx="20" cy="18" r="0.7" fill="currentColor"/>' +
           '</svg>';
  }
  function navIconChoghadiya() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
             '<circle cx="12" cy="12" r="8.5" fill="currentColor" fill-opacity=".12"/>' +
             '<path d="M12 6.5v5.5l3.4 2"/>' +
             '<path d="M5.5 4.5 3.8 6.2M18.5 4.5l1.7 1.7"/>' +
             '<circle cx="12" cy="12" r="1.2" fill="currentColor"/>' +
           '</svg>';
  }
  function navIconKundli() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
             '<rect x="3.5" y="3.5" width="17" height="17" rx="1.2"/>' +
             '<path d="M3.5 12h17M12 3.5v17M3.5 3.5l17 17M20.5 3.5l-17 17"/>' +
             '<circle cx="12" cy="12" r="1.6" fill="currentColor"/>' +
           '</svg>';
  }
  function navIconRemedies() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
             '<path d="M12 3.5c-1.6 3 -3 4.4 -3 7a3 3 0 0 0 6 0c0-1.2 -.6 -2.4 -1.6 -3.6 -.6 1.2 -1.4 1.2 -1.4 0z" fill="currentColor" fill-opacity=".22"/>' +
             '<path d="M7 14.5h10l-1.5 6h-7z"/>' +
             '<path d="M9 17h6"/>' +
           '</svg>';
  }
  function navIconLibrary() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
             '<path d="M5 4.5c0-1 1-1.8 2.2-1.3L12 5.2l4.8-2c1.2-.5 2.2.3 2.2 1.3v14c0 .8-.8 1.3-1.5 1L12 17.3l-5.5 2.2c-.7.3-1.5-.2-1.5-1z" fill="currentColor" fill-opacity=".12"/>' +
             '<path d="M12 5.2v12.1M8 7.5h1.8M14.2 7.5H16"/>' +
           '</svg>';
  }
  function navIconProfile() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
             '<circle cx="12" cy="8.5" r="3.6" fill="currentColor" fill-opacity=".18"/>' +
             '<path d="M4.5 20.5c.8 -4 4 -6.5 7.5 -6.5s6.7 2.5 7.5 6.5"/>' +
           '</svg>';
  }

  var BOTTOM = [
    { key: 'home',             label: 'Home',        svg: navIconHome() },
    { key: 'choghadiya',       label: 'Choghadiya',  svg: navIconChoghadiya() },
    { key: 'kundli',           label: 'Kundli',      svg: navIconKundli() },
    { key: 'library',          label: 'Library',     svg: navIconLibrary() },
    { key: 'profile',          label: 'Profile',     svg: navIconProfile() }
  ];
  // Map page → which bottom-nav key is active.
  // Bottom nav is shown on every page (including splash/onboarding/auth)
  // so the journey always feels like one cohesive app.
  var ACTIVE_FOR = {
    'welcome-page': 'home',
    'choghadiya': 'choghadiya',
    'library': 'library',
    'daily-predication-page': 'home',
    'predictions': 'home',
    'kundli': 'kundli',
    'remedies': 'library',
    'services': 'library',
    'profile-page': 'profile',
    'subscribenow-page': 'profile',
    'subscription-activated': 'profile',
    'manage-subscription': 'profile',
    'edit-profile': 'profile',
    'notifications': 'profile',
    'help': 'profile',
    'signin': 'profile',
    'register': 'profile',
    'splash': 'home',
    'onboarding': 'home'
  };

  function buildBottomNav() {
    var activeKey = ACTIVE_FOR[currentFolder] || '';
    var inner = BOTTOM.map(function (b) {
      var cls = activeKey === b.key ? 'sy-bottom-nav__item active' : 'sy-bottom-nav__item';
      return '<button class="' + cls + '" data-sy-go="' + b.key + '">' + b.svg + '<span>' + b.label + '</span></button>';
    }).join('');
    return '<nav class="sy-bottom-nav" role="navigation"><div class="sy-bottom-nav__inner">' + inner + '</div></nav>';
  }

  // ============================================================
  // INIT — runs as soon as DOM is ready
  // ============================================================
  function init() {
    document.body.setAttribute('data-sy-shell', 'true');
    if (currentFolder) {
      document.body.classList.add('sy-page-' + currentFolder);
    }
    // Replace static "Raj" placeholders with the logged-in user's first name
    var u = getUser();
    if (u.name) {
      var first = u.name.split(' ')[0];
      document.querySelectorAll('[data-sy-username]').forEach(function (el) { el.textContent = u.name; });
      document.querySelectorAll('[data-sy-firstname]').forEach(function (el) { el.textContent = first; });
    }
    // Render uploaded avatar (base64) into any [data-sy-avatar] slot
    function paintAvatar() {
      var who = getUser();
      var slots = document.querySelectorAll('[data-sy-avatar]');
      slots.forEach(function (slot) {
        // Remove any previous image
        var old = slot.querySelector('img.sy-avatar-img');
        if (old) old.remove();
        if (who.avatar) {
          var img = document.createElement('img');
          img.src = who.avatar;
          img.alt = who.name || 'Profile photo';
          img.className = 'sy-avatar-img';
          slot.appendChild(img);
        }
      });
    }
    paintAvatar();
    window.SY.paintAvatar = paintAvatar;

    // Inject drawer once
    if (!document.querySelector('.sy-drawer')) {
      var wrap = document.createElement('div');
      wrap.innerHTML = drawerHTML;
      // Append nodes in order so backdrop sits before drawer
      while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    }

    // Industry-standard header normalization:
    // Every <header class="sy-topbar"> right-side menu button → notification bell.
    // Drawer remains accessible from the hamburger on top-level pages
    // + the edge-swipe gesture on touch.
    normalizeHeaders();

    // Apply persisted language to the drawer buttons + wire toggle
    setLang(getLang());
    document.querySelectorAll('.sy-drawer__lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var lang = btn.getAttribute('data-lang');
        if (lang === getLang()) return;
        setLang(lang);
        toast(lang === 'hi' ? 'भाषा बदली: हिंदी' : 'Language: English', 'success');
      });
    });

    // Bottom nav: ALWAYS inject the shared shell nav so every page
    // shares the exact same nav (the welcome-page bundles its own
    // legacy nav which is hidden by CSS).
    if (!document.querySelector('.sy-bottom-nav')) {
      var navWrap = document.createElement('div');
      navWrap.innerHTML = buildBottomNav();
      document.body.appendChild(navWrap.firstChild);
    }

    // If no hamburger or topbar back-button exists on the page, drop a
    // floating menu trigger so users can always reach the drawer.
    var hasMenuTrigger = document.querySelector('.menu-btn, [data-menu-toggle], .sy-floating-menu');
    // header.sy-hero is just a branded hero block (no back/menu button)
    // so it doesn't count as a "real" topbar — keep the floating menu.
    var hasOwnTopbar = document.querySelector('.topbar, .sy-topbar, .top-header, header.brand');
    if (!hasMenuTrigger && !hasOwnTopbar) {
      var fab = document.createElement('button');
      fab.className = 'sy-floating-menu';
      fab.setAttribute('aria-label', 'Open menu');
      fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
      fab.addEventListener('click', openDrawer);
      document.body.appendChild(fab);
    }
    // On pages with their own topbar but no hamburger, retag a settings
    // icon (if present) to act as the drawer toggle.
    if (!hasMenuTrigger && hasOwnTopbar) {
      var settingsBtn = document.querySelector('.topbar .icon-btn[aria-label="Settings"]');
      if (settingsBtn) {
        settingsBtn.setAttribute('data-menu-toggle', '');
        settingsBtn.setAttribute('aria-label', 'Menu');
      }
    }

    // Page-specific in-page button routing (label / class fallbacks)
    wirePageSpecific();

    // Make non-button [data-sy-go] elements keyboard-activatable
    document.querySelectorAll('[data-sy-go]').forEach(function (el) {
      var tag = (el.tagName || '').toLowerCase();
      if (tag === 'button' || tag === 'a') return;
      if (!el.hasAttribute('role'))     el.setAttribute('role', 'button');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target;
      if (t.closest && t.closest('input, textarea, select')) return;
      var goEl = t.closest && t.closest('[data-sy-go]');
      if (goEl && (goEl.getAttribute('role') === 'button' || goEl.tagName === 'BUTTON' || goEl.tagName === 'A')) {
        e.preventDefault();
        goEl.click();
      }
    });

    // Wire all clicks (delegation)
    document.addEventListener('click', function (e) {
      var t = e.target;
      // Drawer toggle (hamburger, menu icon)
      var trigger = t.closest && t.closest('.menu-btn, [data-menu-toggle]');
      if (trigger) {
        e.preventDefault();
        openDrawer();
        return;
      }
      // Drawer close
      if (t.closest && t.closest('[data-sy-drawer-close]')) {
        e.preventDefault();
        closeDrawer();
        return;
      }
      // Universal nav action via data-sy-go
      var go = t.closest && t.closest('[data-sy-go]');
      if (go) {
        e.preventDefault();
        e.stopPropagation();
        var key = go.getAttribute('data-sy-go');
        closeDrawer();
        // Logout intercept — confirm + clear stored user
        if (key === 'signin' && (go.classList.contains('logout') || (go.textContent || '').toLowerCase().indexOf('logout') >= 0)) {
          confirmModal({
            title: 'Log out?',
            message: 'You will need to sign in again to access your divine guidance.',
            confirmLabel: 'LOG OUT',
            cancelLabel: 'STAY',
            variant: 'danger'
          }).then(function (ok) {
            if (ok) {
              clearUser();
              toast('Logged out');
              setTimeout(function () { navTo(key); }, 400);
            }
          });
          return;
        }
        navTo(key);
        return;
      }
    }, true);

    // Esc closes drawer
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    // Edge-swipe to open the drawer (industry-standard gesture)
    bindEdgeSwipe();

    // Scroll reveal — fade cards/sections in as they enter the viewport.
    // Skip on prefers-reduced-motion (CSS already shows them immediately).
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var revealSel = '.sy-reveal, .sy-card, .gold-border-card, .card-border, .feature-card, .r-card, .astro-card, .ms-plan-card, .n-row, .sy-tile';
    var targets = document.querySelectorAll(revealSel);
    if (prefersReduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var staggerCounter = 0;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            // tiny stagger within the same batch for a cascading feel
            el.style.transitionDelay = (staggerCounter % 5 * 60) + 'ms';
            staggerCounter++;
            el.classList.add('is-visible');
            // hand off the bar-fill animation for meters
            el.querySelectorAll('.dp-meter').forEach(function (m) {
              var pct = m.getAttribute('data-pct');
              if (pct) m.style.setProperty('--w', pct + '%');
            });
            io.unobserve(el);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      targets.forEach(function (el) { io.observe(el); });
      // Reveal anything currently above the fold immediately
      requestAnimationFrame(function () {
        targets.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.9) {
            el.classList.add('is-visible');
            el.querySelectorAll('.dp-meter').forEach(function (m) {
              var pct = m.getAttribute('data-pct');
              if (pct) m.style.setProperty('--w', pct + '%');
            });
            io.unobserve(el);
          }
        });
      });
    }
  }

  // ============================================================
  // HEADER NORMALIZATION
  // Replace inconsistent right-side header button with a unified
  // notification bell + badge. Don't touch pages that already use
  // a bell (library, choghadiya) or pages without sy-topbar.
  // ============================================================
  function bellSVG() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
             '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>' +
             '<path d="M13.7 21a2 2 0 0 1-3.4 0"/>' +
           '</svg>';
  }
  function bellButtonHTML(badge) {
    var b = badge && badge > 0 ? '<span class="sy-topbar__badge">' + badge + '</span>' : '';
    return '<button class="sy-topbar__btn sy-topbar__bell" data-sy-go="notifications" aria-label="Notifications" type="button">' + bellSVG() + b + '</button>';
  }

  function normalizeHeaders() {
    var badge = 3; // demo unread count

    // ---- Standard <header class="sy-topbar"> pages ----
    document.querySelectorAll('header.sy-topbar').forEach(function (hdr) {
      // Right side: replace any menu hamburger with a notification bell.
      // Skip pages that already have a bell hardcoded (library, choghadiya).
      var hasBell = !!hdr.querySelector('[aria-label="Notifications"]');
      if (hasBell) return;
      var menuBtn = hdr.querySelector('[data-menu-toggle], [aria-label="Menu"]');
      if (menuBtn) {
        var bell = document.createElement('div');
        bell.innerHTML = bellButtonHTML(currentFolder === 'notifications' ? 0 : badge);
        menuBtn.replaceWith(bell.firstChild);
      }
    });

    // ---- Welcome-page top-header: add the bell next to the crown ----
    var topHeader = document.querySelector('.top-header');
    if (topHeader && !topHeader.querySelector('[aria-label="Notifications"]')) {
      var premium = topHeader.querySelector('.premium-badge, .premium-crown-btn');
      var bellEl = document.createElement('button');
      bellEl.className = 'bell-btn sy-topbar__bell';
      bellEl.setAttribute('aria-label', 'Notifications');
      bellEl.setAttribute('data-sy-go', 'notifications');
      bellEl.setAttribute('type', 'button');
      bellEl.innerHTML = bellSVG() + '<span class="sy-topbar__badge">' + badge + '</span>';
      if (premium) topHeader.insertBefore(bellEl, premium);
      else topHeader.appendChild(bellEl);
    }
  }

  // ============================================================
  // EDGE-SWIPE: drag from the left edge to open the drawer.
  // Industry-standard Material Design gesture; lets users reach
  // the drawer from sub-pages where the hamburger isn't in view.
  // ============================================================
  function bindEdgeSwipe() {
    var EDGE = 22;          // px from left edge to start
    var THRESHOLD = 60;     // px drag distance to trigger
    var startX = null, startY = null, tracking = false;
    document.addEventListener('touchstart', function (e) {
      if (!e.touches || !e.touches.length) return;
      var t = e.touches[0];
      if (t.clientX <= EDGE) {
        startX = t.clientX; startY = t.clientY; tracking = true;
      }
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      var t = e.touches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      // Cancel if mostly vertical
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 16) tracking = false;
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = (e.changedTouches && e.changedTouches[0]) || null;
      if (!t) return;
      if (t.clientX - startX > THRESHOLD) openDrawer();
    }, { passive: true });
  }

  // ============================================================
  // PAGE-SPECIFIC: tag existing in-page CTAs with data-sy-go
  // so the shell's universal click handler routes them.
  // ============================================================
  function tagByText(sel, phrase, key) {
    document.querySelectorAll(sel).forEach(function (el) {
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (t.indexOf(phrase) >= 0 && !el.hasAttribute('data-sy-go')) {
        el.setAttribute('data-sy-go', key);
      }
    });
  }
  function tagBySelector(sel, key) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (!el.hasAttribute('data-sy-go')) el.setAttribute('data-sy-go', key);
    });
  }

  function wirePageSpecific() {
    if (currentFolder === 'welcome-page') {
      tagBySelector('.premium-badge', 'manage-subscription');
      tagByText('.gold-btn, button', 'read full prediction', 'daily-prediction');
      tagByText('.list-row', 'my profile', 'profile');
      tagByText('.list-row', 'manage subscription', 'manage-subscription');
      tagByText('.list-row', 'logout', 'signin');
      tagBySelector('.subscription-banner .gold-btn', 'manage-subscription');

      // Tag each Explore Premium Features card by its title
      document.querySelectorAll('.feature-card').forEach(function (card) {
        var titleEl = card.querySelector('.feature-title');
        var title = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim().toLowerCase() : '';
        var key = '';
        if (title.indexOf('daily') >= 0) key = 'daily-prediction';
        else if (title.indexOf('kundli') >= 0 || title.indexOf('birth chart') >= 0) key = 'kundli';
        else if (title.indexOf('remed') >= 0 || title.indexOf('upay') >= 0) key = 'remedies';
        if (key) card.setAttribute('data-sy-go', key);
      });
    }
    if (currentFolder === 'daily-predication-page') {
      tagBySelector('.back-button', 'home');
      tagBySelector('.premium-button', 'subscribenow');
    }
    if (currentFolder === 'profile-page') {
      tagBySelector('.topbar .icon-btn[aria-label="Back"]', 'home');
      tagByText('.menu-list li', 'my profile', 'profile');
      tagByText('.menu-list li', 'edit details', 'profile');
      tagByText('.menu-list li', 'change password', 'profile');
      tagByText('.menu-list li', 'manage subscription', 'manage-subscription');
      tagByText('.menu-list li', 'help', 'help');
      tagBySelector('.logout', 'signin');
    }
    if (currentFolder === 'subscribenow-page') {
      tagBySelector('.sy-cta', 'subscription-activated');
    }
    if (currentFolder === 'subscription-activated') {
      tagBySelector('.btn--primary', 'home');
      tagBySelector('.btn--ghost', 'manage-subscription');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
