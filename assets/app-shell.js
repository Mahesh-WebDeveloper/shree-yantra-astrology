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
    profile:                "profile-page",
    payment:                "payment",
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

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

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
      var title = opts.title ? '<h3 class="sy-modal__title">' + escapeHTML(opts.title) + '</h3>' : '';
      var message = opts.message ? '<p class="sy-modal__msg">' + escapeHTML(opts.message) + '</p>' : '';
      var cancelLabel = escapeHTML(opts.cancelLabel || 'CANCEL');
      var confirmLabel = escapeHTML(opts.confirmLabel || 'CONFIRM');
      wrap.innerHTML =
        '<div class="sy-modal__backdrop" data-close></div>' +
        '<div class="sy-modal__panel" tabindex="-1">' +
          title +
          message +
          '<div class="sy-modal__actions">' +
            '<button class="sy-btn sy-btn--ghost" data-action="cancel">' + cancelLabel + '</button>' +
            '<button class="sy-btn ' + (opts.variant === 'danger' ? 'sy-btn--danger' : 'sy-btn--primary') + '" data-action="confirm">' + confirmLabel + '</button>' +
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
  var SUPPORTED_LANGS = ['en', 'hi'];
  function getLang() {
    try {
      var v = localStorage.getItem(LANG_KEY);
      if (v && SUPPORTED_LANGS.indexOf(v) >= 0) return v;
      return 'en';
    } catch (_) { return 'en'; }
  }

  // Current visual theme (persisted in localStorage).
  // Light is the default preview mode; dark remains available for the
  // client-approved dark UI.
  var THEME_KEY = 'sy.theme';
  var SUPPORTED_THEMES = ['light', 'dark'];
  function getTheme() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      if (v && SUPPORTED_THEMES.indexOf(v) >= 0) return v;
      return 'dark';            // client-approved dark is the default
    } catch (_) { return 'dark'; }
  }
  function applyTheme(theme) {
    var next = SUPPORTED_THEMES.indexOf(theme) >= 0 ? theme : 'dark';
    document.documentElement.setAttribute('data-sy-theme', next);
    if (document.body) {
      document.body.setAttribute('data-sy-theme', next);
      document.body.classList.toggle('sy-theme-light', next === 'light');
      document.body.classList.toggle('sy-theme-dark', next === 'dark');
    }
    document.querySelectorAll('.sy-drawer__theme-btn[data-theme]').forEach(function (b) {
      var active = b.getAttribute('data-theme') === next;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.querySelectorAll('.sy-theme-fab[data-theme]').forEach(function (b) {
      var active = b.getAttribute('data-theme') === next;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', next === 'light' ? '#fffaf0' : '#03030c');
    }
    return next;
  }
  function setTheme(theme) {
    var next = SUPPORTED_THEMES.indexOf(theme) >= 0 ? theme : 'dark';
    var apply = function () {
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    };
    // Smooth cross-fade between themes (View Transitions API). Falls back to an
    // instant switch where unsupported or when reduced-motion is requested.
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
    return next;
  }
  applyTheme(getTheme());
  window.SY.getTheme = getTheme;
  window.SY.setTheme = setTheme;
  // ============================================================
  // I18N — contextual English ⟷ Hindi translation.
  // Keyed by the EXACT trimmed English text as it appears in the DOM.
  // Preview build exposes only English + Hindi so the drawer never promises
  // a language that still falls back to English.
  // ============================================================
  var I18N = {
    hi: {
      /* ---- shell / nav / drawer ---- */
      "Astrology": "ज्योतिष",
      "Menu": "मेन्यू",
      "Notifications": "सूचनाएँ",
      "Premium plan": "प्रीमियम योजना",
      "Premium": "प्रीमियम",
      "Home": "होम",
      "Choghadiya": "चौघड़िया",
      "Kundli": "कुंडली",
      "Library": "पुस्तकालय",
      "Profile": "प्रोफ़ाइल",
      "Daily Prediction": "दैनिक भविष्यवाणी",
      "Divine Library": "दिव्य पुस्तकालय",
      "Kundli / Birth Chart": "कुंडली / जन्म कुंडली",
      "Remedies & Upay": "उपाय एवं समाधान",
      "Astrologer Services": "ज्योतिषी सेवाएँ",
      "My Profile": "मेरी प्रोफ़ाइल",
      "Manage Subscription": "सदस्यता प्रबंधित करें",
      "Help & Support": "सहायता एवं समर्थन",
      "Logout": "लॉग आउट",
      "Namaste,": "नमस्ते,",
      "Language / भाषा": "भाषा / Language",
      "SHREE YANTRA · ASTROLOGY v1.0": "श्री यंत्र · ज्योतिष v1.0",
      "SHREE YANTRA · ASTROLOGY v1.0.0": "श्री यंत्र · ज्योतिष v1.0.0",
      "Back": "वापस",

      /* ---- welcome ---- */
      "Your cosmic journey begins today": "आपकी ब्रह्मांडीय यात्रा आज से शुरू होती है",
      "Leo": "सिंह",
      "Leo · Today's Reading": "सिंह · आज का राशिफल",
      "Today, 24 May 2025": "आज, 24 मई 2025",
      "A powerful day ahead — luck favours bold decisions. Financial growth and relationship harmony align.": "आगे एक शक्तिशाली दिन — भाग्य साहसिक निर्णयों का साथ देगा। आर्थिक उन्नति और रिश्तों में सामंजस्य रहेगा।",
      "✦ Lucky #7": "✦ शुभ अंक 7",
      "◈ Gold": "◈ स्वर्ण",
      "☽ Eve peak": "☽ संध्या शुभ",
      "Read Full Prediction": "पूरी भविष्यवाणी पढ़ें",
      "Explore Premium Features": "प्रीमियम सुविधाएँ देखें",
      "Daily": "दैनिक",
      "Prediction": "भविष्यवाणी",
      "Get your daily horoscope and astrological insights": "अपना दैनिक राशिफल और ज्योतिषीय जानकारी प्राप्त करें",
      "View your detailed birth chart and planetary positions": "अपनी विस्तृत जन्म कुंडली और ग्रहों की स्थिति देखें",
      "Remedies / Upay": "उपाय / समाधान",
      "Powerful remedies to improve your life and remove obstacles": "अपने जीवन को बेहतर बनाने और बाधाएँ दूर करने के लिए प्रभावी उपाय",
      "Today's Prediction": "आज की भविष्यवाणी",
      "Luck is strong after sunset": "सूर्यास्त के बाद भाग्य प्रबल है",
      "Lucky #7": "शुभ अंक 7",
      "Gold": "स्वर्ण",
      "04:12 PM good time": "04:12 PM शुभ समय",
      "Focus on money decisions and important calls in the evening. Keep speech calm before noon.": "शाम को धन संबंधी निर्णयों और महत्वपूर्ण कॉल पर ध्यान दें। दोपहर से पहले वाणी संयमित रखें।",
      "View Details": "विवरण देखें",

      /* ---- choghadiya ---- */
      "CHOGHADIYA": "चौघड़िया",
      "Know Today's Auspicious & Inauspicious Timings": "आज के शुभ और अशुभ मुहूर्त जानें",
      "21 May 2025, Wednesday": "21 मई 2025, बुधवार",
      "Currently Active": "वर्तमान में सक्रिय",
      "LABH": "लाभ",
      "Good time for business, financial transactions, deals and purchases.": "व्यापार, वित्तीय लेन-देन, सौदों और खरीदारी के लिए शुभ समय।",
      "HRS": "घंटे",
      "Today's Choghadiya": "आज का चौघड़िया",
      "AMRIT": "अमृत",
      "SHUBH": "शुभ",
      "CHAR": "चर",
      "UDVEG": "उद्वेग",
      "KAAL": "काल",
      "ROG": "रोग",
      "Auspicious": "शुभ",
      "Neutral": "सामान्य",
      "Inauspicious": "अशुभ",
      "LABH (VARTMAN)": "लाभ (वर्तमान)",
      "Timings are based on your location (Jaipur, Rajasthan)": "समय आपके स्थान (जयपुर, राजस्थान) पर आधारित हैं",
      "Which Choghadiya is best for which activity?": "कौन-सा चौघड़िया किस कार्य के लिए सर्वोत्तम है?",
      "Business / Deal Signing": "व्यापार / सौदा हस्ताक्षर",
      "LABH / AMRIT": "लाभ / अमृत",
      "Buying New Items": "नई वस्तुएँ खरीदना",
      "SHUBH / LABH": "शुभ / लाभ",
      "Gold / Jewelry Purchase": "सोना / आभूषण खरीद",
      "Vehicle Purchase": "वाहन खरीद",
      "Money Transfer": "धन हस्तांतरण",
      "Travel / Journey": "यात्रा",
      "Social Media Posting": "सोशल मीडिया पोस्टिंग",
      "Interview / Meeting": "साक्षात्कार / बैठक",
      "Worship / Prayer": "पूजा / प्रार्थना",
      "TODAY'S SPECIAL MESSAGE": "आज का विशेष संदेश",
      "From 04:12 PM to 05:38 PM is Labh Choghadiya. It is an excellent time for business, financial transactions and buying valuable items.": "04:12 PM से 05:38 PM तक लाभ चौघड़िया है। यह व्यापार, वित्तीय लेन-देन और मूल्यवान वस्तुएँ खरीदने के लिए उत्तम समय है।",
      "UPCOMING AUSPICIOUS TIMINGS": "आगामी शुभ मुहूर्त",
      "VERY AUSPICIOUS TIME": "अत्यंत शुभ समय",
      "GOOD FOR IMPORTANT TASKS": "महत्वपूर्ण कार्यों के लिए शुभ",
      "GOOD FOR MONEY RELATED WORK": "धन संबंधी कार्यों के लिए शुभ",

      /* ---- notifications ---- */
      "ALL": "सभी",
      "PREDICTIONS": "भविष्यवाणियाँ",
      "ACCOUNT": "खाता",
      "MARK ALL AS READ": "सभी को पढ़ा हुआ चिह्नित करें",
      "TODAY": "आज",
      "YESTERDAY": "बीता कल",
      "EARLIER": "पहले",
      "Today's Prediction is Ready": "आज की भविष्यवाणी तैयार है",
      "Leo · A powerful day for finance & relationships. Read your full prediction.": "सिंह · धन और रिश्तों के लिए शक्तिशाली दिन। अपनी पूरी भविष्यवाणी पढ़ें।",
      "Premium Renews in 5 Days": "प्रीमियम 5 दिनों में नवीनीकृत होगा",
      "Your premium subscription will renew on 24 Jun. Tap to manage your plan.": "आपकी प्रीमियम सदस्यता 24 जून को नवीनीकृत होगी। अपनी योजना प्रबंधित करने के लिए टैप करें।",
      "Auspicious Time Alert": "शुभ समय सूचना",
      "Brahma muhurta begins at 4:18 AM tomorrow — ideal for meditation.": "ब्रह्म मुहूर्त कल 4:18 AM पर शुरू होगा — ध्यान के लिए आदर्श।",
      "New Insight in Your Kundli": "आपकी कुंडली में नई जानकारी",
      "Jupiter Mahadasha activated · favourable period until Feb 2040.": "गुरु महादशा सक्रिय · फरवरी 2040 तक अनुकूल अवधि।",
      "Pandit Suresh sent you a message": "पंडित सुरेश ने आपको संदेश भेजा",
      "Welcome to Premium": "प्रीमियम में आपका स्वागत है",
      "Unlimited predictions, kundli analysis & astrologer chats are now active.": "असीमित भविष्यवाणियाँ, कुंडली विश्लेषण और ज्योतिषी चैट अब सक्रिय हैं।",
      "2 min": "2 मिनट",
      "1 hr": "1 घंटा",
      "4 hr": "4 घंटे",
      "23 May": "23 मई",
      "24 Apr": "24 अप्रैल",

      /* ---- daily prediction ---- */
      "LEO": "सिंह",
      "Today · 24 May 2025": "आज · 24 मई 2025",
      "A powerful day for you. Confidence rises and your work brings positive recognition. Avoid arguments before noon. Evening favours financial decisions and quality time with family.": "आपके लिए शक्तिशाली दिन। आत्मविश्वास बढ़ेगा और आपके कार्य को सकारात्मक पहचान मिलेगी। दोपहर से पहले विवाद से बचें। शाम आर्थिक निर्णयों और परिवार के साथ समय के लिए शुभ है।",
      "★ Lucky Colour Gold": "★ शुभ रंग स्वर्ण",
      "# Lucky Number 7": "# शुभ अंक 7",
      "Today's Cosmic Mood": "आज की ब्रह्मांडीय स्थिति",
      "Energy": "ऊर्जा",
      "Love": "प्रेम",
      "Career": "करियर",
      "Health": "स्वास्थ्य",
      "Finance": "धन",
      "Auspicious Timings": "शुभ मुहूर्त",
      "Sunrise": "सूर्योदय",
      "Sunset": "सूर्यास्त",
      "Brahma Muhurta": "ब्रह्म मुहूर्त",
      "Rahu Kalam": "राहु काल",
      "Suggested Remedies": "सुझाए गए उपाय",
      "Light a Ghee Diya": "घी का दीया जलाएँ",
      "In the evening, in front of your family altar — invites positive energy.": "शाम को अपने पूजा स्थल के सामने — सकारात्मक ऊर्जा को आमंत्रित करता है।",
      "EVENING · DAILY": "संध्या · प्रतिदिन",
      "Donate Wheat & Jaggery": "गेहूँ और गुड़ का दान करें",
      "To attract abundance and strengthen the Sun in your chart.": "समृद्धि आकर्षित करने और अपनी कुंडली में सूर्य को मजबूत करने के लिए।",
      "SUNDAY · BEFORE NOON": "रविवार · दोपहर से पहले",
      "Chant Aditya Hridayam": "आदित्य हृदयम् का पाठ करें",
      "11 cycles invoke Sun's blessings for courage and vitality.": "11 आवृत्तियाँ साहस और जीवनशक्ति हेतु सूर्य का आशीर्वाद आमंत्रित करती हैं।",
      "SUNRISE · 11 ×": "सूर्योदय · 11 ×",
      "More Insights": "और जानकारी",
      "Warmth in your relationships today.": "आज आपके रिश्तों में गर्माहट रहेगी।",
      "A new opportunity may surface.": "एक नया अवसर सामने आ सकता है।",
      "Stability improves through the week.": "सप्ताह भर स्थिरता बेहतर होगी।",
      "Energy is high — exercise pays off.": "ऊर्जा उच्च है — व्यायाम लाभदायक रहेगा।",
      "Note · Predictions are based on classical Vedic Astrology and may vary depending on your exact birth details.": "नोट · भविष्यवाणियाँ शास्त्रीय वैदिक ज्योतिष पर आधारित हैं और आपके सटीक जन्म विवरण के अनुसार भिन्न हो सकती हैं।",
      "SAVE": "सहेजें",
      "SHARE PREDICTION": "भविष्यवाणी साझा करें",

      /* ---- kundli ---- */
      "YOUR BIRTH CHART": "आपकी जन्म कुंडली",
      "Leo Ascendant · Moon in Cancer": "सिंह लग्न · कर्क में चंद्रमा",
      "DOB": "जन्म तिथि",
      "Time": "समय",
      "Place": "स्थान",
      "Jaipur": "जयपुर",
      "OVERVIEW": "सारांश",
      "PLANETS": "ग्रह",
      "DASHA": "दशा",
      "YOGA": "योग",
      "DOSHA": "दोष",
      "KEY INSIGHTS": "मुख्य जानकारी",
      "With Sun rising in your 1st house, you radiate natural leadership. Jupiter in the 8th brings deep wisdom but warns against speculation. Saturn's aspect on your 10th house suggests slow but solid career growth — especially after 28.": "आपके प्रथम भाव में सूर्य के उदय से आप स्वाभाविक नेतृत्व क्षमता प्रकट करते हैं। अष्टम में गुरु गहन ज्ञान देता है पर सट्टेबाज़ी से सावधान करता है। दशम भाव पर शनि की दृष्टि धीमी पर ठोस करियर वृद्धि दर्शाती है — विशेषकर 28 वर्ष के बाद।",
      "PLANETARY POSITIONS": "ग्रहों की स्थिति",
      "SUN": "सूर्य",
      "MOON": "चंद्र",
      "MARS": "मंगल",
      "JUPITER": "गुरु",
      "SATURN": "शनि",
      "1st House · Leo · 12°": "प्रथम भाव · सिंह · 12°",
      "12th House · Cancer · 04°": "द्वादश भाव · कर्क · 04°",
      "3rd House · Libra · 22°": "तृतीय भाव · तुला · 22°",
      "8th House · Pisces · 18°": "अष्टम भाव · मीन · 18°",
      "10th House · Taurus · 09°": "दशम भाव · वृषभ · 09°",
      "Exalted": "उच्च",
      "Own Sign": "स्वराशि",
      "Debilitated": "नीच",
      "Friendly": "मित्र",
      "CURRENT DASHA": "वर्तमान दशा",
      "Jupiter Mahadasha": "गुरु महादशा",
      "Mar 2024 – Feb 2040 · 16 yr cycle": "मार्च 2024 – फरवरी 2040 · 16 वर्ष चक्र",
      "Favourable": "अनुकूल",
      "UNLOCK FULL ANALYSIS": "पूर्ण विश्लेषण अनलॉक करें",

      /* ---- predictions ---- */
      "Predictions": "भविष्यवाणियाँ",
      "Your Daily Cosmic Brief": "आपका दैनिक ब्रह्मांडीय सार",
      "Updated 24 May 2025 · Leo ♌": "अपडेट 24 मई 2025 · सिंह ♌",
      "DAILY": "दैनिक",
      "WEEKLY": "साप्ताहिक",
      "MONTHLY": "मासिक",
      "YEARLY": "वार्षिक",
      "TODAY · LEO": "आज · सिंह",
      "The Sun's placement in your 5th house favours creativity. Avoid arguments with elders before noon. Evening brings positive financial news. Wear gold or yellow for added luck.": "आपके पंचम भाव में सूर्य की स्थिति रचनात्मकता के लिए शुभ है। दोपहर से पहले बड़ों से विवाद से बचें। शाम सकारात्मक आर्थिक समाचार लाती है। अतिरिक्त भाग्य के लिए स्वर्ण या पीला रंग पहनें।",
      "READ FULL PREDICTION ›": "पूरी भविष्यवाणी पढ़ें ›",
      "Pick Your Sign": "अपनी राशि चुनें",
      "ARIES": "मेष",
      "TAURUS": "वृषभ",
      "GEMINI": "मिथुन",
      "CANCER": "कर्क",
      "VIRGO": "कन्या",
      "LIBRA": "तुला",
      "SCORPIO": "वृश्चिक",
      "SAGITTARIUS": "धनु",
      "CAPRICORN": "मकर",
      "AQUARIUS": "कुंभ",
      "PISCES": "मीन",
      "Deeper Insights": "गहरी जानकारी",
      "Love Compatibility": "प्रेम अनुकूलता",
      "Match your sign with your partner's": "अपनी राशि अपने साथी की राशि से मिलाएँ",
      "Kundli Analysis": "कुंडली विश्लेषण",
      "Your full birth chart, decoded": "आपकी पूरी जन्म कुंडली, विस्तार से",
      "Talk to an Astrologer": "ज्योतिषी से बात करें",
      "Live consultation in 5 mins": "5 मिनट में लाइव परामर्श",

      /* ---- remedies ---- */
      "Remedies": "उपाय",
      "DIVINE UPAY": "दिव्य उपाय",
      "Harmonise Your Path": "अपने मार्ग को संतुलित करें",
      "Vedic remedies tuned to your current dasha.": "आपकी वर्तमान दशा के अनुसार वैदिक उपाय।",
      "Pooja": "पूजा",
      "Yantra": "यंत्र",
      "Vrat": "व्रत",
      "Mantra": "मंत्र",
      "Daan": "दान",
      "Fasting": "उपवास",
      "Recommended For Leo": "सिंह के लिए अनुशंसित",
      "Surya Namaskar": "सूर्य नमस्कार",
      "12 rounds at sunrise · boosts confidence and vitality": "सूर्योदय पर 12 आवृत्तियाँ · आत्मविश्वास और ऊर्जा बढ़ाता है",
      "15 min": "15 मिनट",
      "In front of family altar · invites positive energy": "पूजा स्थल के सामने · सकारात्मक ऊर्जा को आमंत्रित करता है",
      "Evening": "संध्या",
      "Strengthens Sun · removes ego-related obstacles": "सूर्य को मजबूत करता है · अहंकार संबंधी बाधाएँ दूर करता है",
      "Sunday": "रविवार",
      "Before noon": "दोपहर से पहले",
      "11 cycles · invokes Sun's blessings for courage": "11 आवृत्तियाँ · साहस हेतु सूर्य का आशीर्वाद आमंत्रित करता है",
      "Sundays": "रविवार",
      "CONSULT AN ASTROLOGER": "ज्योतिषी से परामर्श करें",

      /* ---- services ---- */
      "LIVE NOW": "अभी लाइव",
      "Talk to Vedic Experts": "वैदिक विशेषज्ञों से बात करें",
      "2,400+ certified astrologers · 18 languages": "2,400+ प्रमाणित ज्योतिषी · 18 भाषाएँ",
      "Call": "कॉल",
      "Chat": "चैट",
      "Video": "वीडियो",
      "Top Astrologers": "शीर्ष ज्योतिषी",
      "Vedic": "वैदिक",
      "Lal Kitab": "लाल किताब",
      "Numerology": "अंक ज्योतिष",
      "Tarot": "टैरो",
      "Marriage": "विवाह",
      "Vastu": "वास्तु",
      "Jaimini": "जैमिनी",
      "Nadi": "नाड़ी",
      "/MIN": "/मिनट",
      "💬 CHAT": "💬 चैट",
      "📞 CALL NOW": "📞 अभी कॉल करें",
      "Start chat?": "चैट शुरू करें?",
      "Start call?": "कॉल शुरू करें?",
      "CONTINUE": "जारी रखें",
      "CANCEL": "रद्द करें",

      /* ---- profile ---- */
      "Leo ♌ · Member since Mar 2024": "सिंह ♌ · मार्च 2024 से सदस्य",
      "PREMIUM MEMBER": "प्रीमियम सदस्य",
      "Consults": "परामर्श",
      "Premium Days": "प्रीमियम दिन",
      "My Information": "मेरी जानकारी",
      "Full Name": "पूरा नाम",
      "Date of Birth": "जन्म तिथि",
      "Time of Birth": "जन्म समय",
      "Place of Birth": "जन्म स्थान",
      "Email": "ईमेल",
      "Jaipur, Rajasthan": "जयपुर, राजस्थान",
      "Account": "खाता",
      "Edit Profile": "प्रोफ़ाइल संपादित करें",
      "Update your details & birth info": "अपना विवरण और जन्म जानकारी अपडेट करें",
      "Predictions & account alerts": "भविष्यवाणियाँ और खाता सूचनाएँ",
      "Premium · Next billing 24 Jun": "प्रीमियम · अगला बिलिंग 24 जून",
      "Consultation History": "परामर्श इतिहास",
      "Past chats with astrologers": "ज्योतिषियों के साथ पिछली चैट",
      "Preferences": "प्राथमिकताएँ",
      "Daily predictions & reminders": "दैनिक भविष्यवाणियाँ और अनुस्मारक",
      "Language": "भाषा",
      "Privacy & Security": "गोपनीयता एवं सुरक्षा",
      "Password, data, account": "पासवर्ड, डेटा, खाता",
      "FAQ, contact, feedback": "सामान्य प्रश्न, संपर्क, प्रतिक्रिया",
      "LOGOUT": "लॉग आउट",
      "Remove profile photo?": "प्रोफ़ाइल फ़ोटो हटाएँ?",
      "Your default avatar will be shown instead.": "इसके बजाय आपका डिफ़ॉल्ट अवतार दिखाया जाएगा।",
      "REMOVE": "हटाएँ",
      "KEEP": "रखें",

      /* ---- subscribe now ---- */
      "Discover the path of Divine Guidance": "दिव्य मार्गदर्शन का पथ खोजें",
      "with Ancient Vedic Wisdom": "प्राचीन वैदिक ज्ञान के साथ",
      "SUBSCRIBE NOW": "अभी सदस्यता लें",
      "Unlock Premium Predictions & Remedies": "प्रीमियम भविष्यवाणियाँ और उपाय अनलॉक करें",
      "100% Secure": "100% सुरक्षित",
      "Your data is safe": "आपका डेटा सुरक्षित है",
      "Accurate Prediction": "सटीक भविष्यवाणी",
      "Based on Vedic": "वैदिक पर आधारित",
      "Premium Support": "प्रीमियम सहायता",
      "Dedicated support": "समर्पित सहायता",

      /* ---- manage subscription ---- */
      "Manage Plan": "योजना प्रबंधित करें",
      "ACTIVE": "सक्रिय",
      "Premium Astrology": "प्रीमियम ज्योतिष",
      "Renews automatically on 24 Jun 2025": "24 जून 2025 को स्वतः नवीनीकृत होगा",
      "BILLING DETAILS": "बिलिंग विवरण",
      "Plan": "योजना",
      "Monthly": "मासिक",
      "Amount": "राशि",
      "₹499 / month": "₹499 / माह",
      "Started On": "आरंभ तिथि",
      "Next Billing": "अगला बिलिंग",
      "Payment Method": "भुगतान विधि",
      "YOUR PREMIUM PERKS": "आपके प्रीमियम लाभ",
      "Daily predictions": "दैनिक भविष्यवाणियाँ",
      "Full kundli analysis": "पूर्ण कुंडली विश्लेषण",
      "Unlimited chat": "असीमित चैट",
      "Personal remedies": "व्यक्तिगत उपाय",
      "Auspicious timings": "शुभ मुहूर्त",
      "Personalised dashboard": "व्यक्तिगत डैशबोर्ड",
      "Change Plan": "योजना बदलें",
      "Renews every month": "हर माह नवीनीकृत",
      "/MONTH": "/माह",
      "Quarterly": "त्रैमासिक",
      "Renews every 3 months": "हर 3 माह में नवीनीकृत",
      "SAVE 15%": "15% बचत",
      "/QUARTER": "/तिमाही",
      "Yearly": "वार्षिक",
      "Renews every year": "हर वर्ष नवीनीकृत",
      "SAVE 33%": "33% बचत",
      "/YEAR": "/वर्ष",
      "PAYMENT HISTORY": "भुगतान इतिहास",
      "CANCEL SUBSCRIPTION": "सदस्यता रद्द करें",
      "Cancel your subscription?": "अपनी सदस्यता रद्द करें?",
      "You will keep premium access until your current billing cycle ends. After that, only free predictions will be available.": "आपकी वर्तमान बिलिंग अवधि समाप्त होने तक प्रीमियम पहुँच बनी रहेगी। उसके बाद केवल मुफ़्त भविष्यवाणियाँ उपलब्ध होंगी।",
      "CANCEL ANYWAY": "फिर भी रद्द करें",
      "KEEP PREMIUM": "प्रीमियम रखें",

      /* ---- help ---- */
      "SUPPORT 24×7": "सहायता 24×7",
      "How can we help?": "हम कैसे मदद कर सकते हैं?",
      "Our cosmic team responds within an hour.": "हमारी टीम एक घंटे के भीतर उत्तर देती है।",
      "Chat with us": "हमसे चैट करें",
      "Call helpline": "हेल्पलाइन पर कॉल करें",
      "Email support": "ईमेल सहायता",
      "Knowledge base": "ज्ञान केंद्र",
      "Frequently Asked": "अक्सर पूछे जाने वाले प्रश्न",
      "How is my horoscope calculated?": "मेरा राशिफल कैसे गणना किया जाता है?",
      "We use authentic Vedic Lahiri ayanamsa with your exact birth date, time and location to generate planetary positions and dasha periods.": "हम आपकी सटीक जन्म तिथि, समय और स्थान के साथ प्रामाणिक वैदिक लाहिरी अयनांश का उपयोग कर ग्रहों की स्थिति और दशा अवधि तैयार करते हैं।",
      "Can I cancel my Premium subscription?": "क्या मैं अपनी प्रीमियम सदस्यता रद्द कर सकता हूँ?",
      "Yes, cancel anytime from Profile → Manage Subscription. You'll continue to enjoy Premium until the end of the billing cycle.": "हाँ, प्रोफ़ाइल → सदस्यता प्रबंधित करें से कभी भी रद्द करें। बिलिंग अवधि समाप्त होने तक आप प्रीमियम का आनंद लेते रहेंगे।",
      "Are the astrologers verified?": "क्या ज्योतिषी सत्यापित हैं?",
      "All our astrologers go through a 7-step verification including qualification check, test consultations and user-rating review.": "हमारे सभी ज्योतिषी योग्यता जाँच, परीक्षण परामर्श और उपयोगकर्ता रेटिंग समीक्षा सहित 7-चरण सत्यापन से गुज़रते हैं।",
      "How accurate are the predictions?": "भविष्यवाणियाँ कितनी सटीक हैं?",
      "Vedic astrology is a science of probabilities, not absolutes. Our 4.8★ user rating reflects the average accuracy reported by our community.": "वैदिक ज्योतिष संभावनाओं का विज्ञान है, निश्चितताओं का नहीं। हमारी 4.8★ उपयोगकर्ता रेटिंग हमारे समुदाय द्वारा बताई गई औसत सटीकता दर्शाती है।",
      "How do I talk to an astrologer?": "मैं ज्योतिषी से कैसे बात करूँ?",
      "Open the Consult tab, pick an astrologer, and start chat or call. Premium members get free 5-min sessions every day.": "परामर्श टैब खोलें, एक ज्योतिषी चुनें, और चैट या कॉल शुरू करें। प्रीमियम सदस्यों को हर दिन मुफ़्त 5-मिनट सत्र मिलते हैं।",

      /* ---- sign in ---- */
      "SIGN IN": "साइन इन",
      "WELCOME BACK": "पुनः स्वागत है",
      "Sign in to continue your cosmic journey": "अपनी ब्रह्मांडीय यात्रा जारी रखने के लिए साइन इन करें",
      "Email or Mobile": "ईमेल या मोबाइल",
      "Required": "आवश्यक",
      "Password": "पासवर्ड",
      "Password must be at least 6 characters": "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए",
      "Remember me": "मुझे याद रखें",
      "Forgot Password?": "पासवर्ड भूल गए?",
      "OR CONTINUE WITH": "या इसके साथ जारी रखें",
      "Google": "Google",
      "Apple": "Apple",
      "New to Shree Yantra?": "श्री यंत्र पर नए हैं?",
      "Create Account": "खाता बनाएँ",

      /* ---- register ---- */
      "CREATE DIVINE PROFILE": "दिव्य प्रोफ़ाइल बनाएँ",
      "Your Cosmic Identity": "आपकी ब्रह्मांडीय पहचान",
      "Tell us how the universe should greet you.": "बताएँ ब्रह्मांड आपका अभिवादन कैसे करे।",
      "Please tell us your name": "कृपया अपना नाम बताएँ",
      "Enter a valid email": "एक मान्य ईमेल दर्ज करें",
      "Mobile Number": "मोबाइल नंबर",
      "Enter a valid mobile number": "एक मान्य मोबाइल नंबर दर्ज करें",
      "Create Password": "पासवर्ड बनाएँ",
      "Password must be at least 8 characters": "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए",
      "Your Birth Details": "आपका जन्म विवरण",
      "Required for accurate kundli & predictions.": "सटीक कुंडली और भविष्यवाणियों के लिए आवश्यक।",
      "Place of Birth": "जन्म स्थान",
      "Required for accurate predictions": "सटीक भविष्यवाणियों के लिए आवश्यक",
      "Gender": "लिंग",
      "Male": "पुरुष",
      "Female": "महिला",
      "Other": "अन्य",
      "What guides you?": "आपका मार्गदर्शन क्या करता है?",
      "Pick what you're most curious about — we'll personalise your home.": "चुनें जिसमें आपकी सबसे अधिक रुचि है — हम आपका होम वैयक्तिकृत करेंगे।",
      "Love & Relationships": "प्रेम और रिश्ते",
      "Compatibility, marriage timing, conflicts": "अनुकूलता, विवाह समय, मतभेद",
      "Career & Business": "करियर और व्यापार",
      "Job changes, promotions, business luck": "नौकरी परिवर्तन, पदोन्नति, व्यापार भाग्य",
      "Wealth & Finance": "धन और वित्त",
      "Money, investments, prosperity yogas": "धन, निवेश, समृद्धि योग",
      "Health & Wellness": "स्वास्थ्य और कल्याण",
      "Daily energy, mental peace, ayurveda": "दैनिक ऊर्जा, मानसिक शांति, आयुर्वेद",
      "BACK": "वापस",
      "CREATE ACCOUNT": "खाता बनाएँ",

      /* ---- onboarding ---- */
      "SKIP ›": "छोड़ें ›",
      "Discover Your Cosmic Path": "अपना ब्रह्मांडीय मार्ग खोजें",
      "Personalised Vedic horoscopes, kundli analysis and ancient remedies — all guided by your stars.": "व्यक्तिगत वैदिक राशिफल, कुंडली विश्लेषण और प्राचीन उपाय — सब आपके सितारों द्वारा निर्देशित।",
      "Daily Divine Guidance": "दैनिक दिव्य मार्गदर्शन",
      "Wake up to predictions tailored to your moon sign, dasha period and planetary transits.": "अपनी चंद्र राशि, दशा अवधि और ग्रह गोचर के अनुसार भविष्यवाणियों के साथ जागें।",
      "Unlock Premium Wisdom": "प्रीमियम ज्ञान अनलॉक करें",
      "Talk to certified astrologers, get personalised remedies and unlimited live consultations.": "प्रमाणित ज्योतिषियों से बात करें, व्यक्तिगत उपाय और असीमित लाइव परामर्श प्राप्त करें।",
      "GET STARTED": "शुरू करें",
      "I ALREADY HAVE AN ACCOUNT": "मेरे पास पहले से खाता है",

      /* ---- splash ---- */
      "PREPARING DIVINE EXPERIENCE": "दिव्य अनुभव तैयार किया जा रहा है",

      /* ---- edit profile ---- */
      "Keep your details up to date for accurate predictions.": "सटीक भविष्यवाणियों के लिए अपना विवरण अद्यतन रखें।",
      "Personal Details": "व्यक्तिगत विवरण",
      "Birth Details": "जन्म विवरण",
      "SAVE CHANGES": "परिवर्तन सहेजें",

      /* ---- subscription activated ---- */
      "PREMIUM · ACTIVE": "प्रीमियम · सक्रिय",
      "Subscription Activated": "सदस्यता सक्रिय हुई",
      "TRIAL DETAILS": "ट्रायल विवरण",
      "Trial Amount": "ट्रायल राशि",
      "Trial Duration": "ट्रायल अवधि",
      "Trial Ends": "ट्रायल समाप्ति",
      "ENTER DASHBOARD": "डैशबोर्ड में जाएँ",
      "MANAGE SUBSCRIPTION": "सदस्यता प्रबंधित करें",
      "Secure Payment by Razorpay": "Razorpay द्वारा सुरक्षित भुगतान",

      /* ---- document titles ---- */
      "Choghadiya - Shree Yantra": "चौघड़िया - श्री यंत्र",
      "Divine Library - Shree Yantra": "दिव्य पुस्तकालय - श्री यंत्र",
      "Notifications · Shree Yantra": "सूचनाएँ · श्री यंत्र",
      "Kundli · Shree Yantra": "कुंडली · श्री यंत्र",
      "Predictions · Shree Yantra": "भविष्यवाणियाँ · श्री यंत्र"
    }
  };

  var HI_MONTHS = {
    Jan: 'जनवरी',
    Feb: 'फ़रवरी',
    Mar: 'मार्च',
    Apr: 'अप्रैल',
    May: 'मई',
    Jun: 'जून',
    Jul: 'जुलाई',
    Aug: 'अगस्त',
    Sep: 'सितंबर',
    Oct: 'अक्टूबर',
    Nov: 'नवंबर',
    Dec: 'दिसंबर'
  };
  var HI_WEEKDAYS = {
    Sunday: 'रविवार',
    Monday: 'सोमवार',
    Tuesday: 'मंगलवार',
    Wednesday: 'बुधवार',
    Thursday: 'गुरुवार',
    Friday: 'शुक्रवार',
    Saturday: 'शनिवार'
  };

  function translateDateToken(day, month, year) {
    return day + ' ' + (HI_MONTHS[month] || month) + ' ' + year;
  }

  function translateDynamicText(key, lang) {
    if (lang !== 'hi') return '';

    var todayMatch = key.match(/^Today,\s+(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})$/);
    if (todayMatch) {
      return 'आज, ' + translateDateToken(todayMatch[1], todayMatch[2], todayMatch[3]);
    }

    var todayDotMatch = key.match(/^Today\s+·\s+(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})$/);
    if (todayDotMatch) {
      return 'आज · ' + translateDateToken(todayDotMatch[1], todayDotMatch[2], todayDotMatch[3]);
    }

    var datedWeekdayMatch = key.match(/^(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4}),\s+([A-Za-z]+)$/);
    if (datedWeekdayMatch) {
      return translateDateToken(datedWeekdayMatch[1], datedWeekdayMatch[2], datedWeekdayMatch[3]) + ', ' + (HI_WEEKDAYS[datedWeekdayMatch[4]] || datedWeekdayMatch[4]);
    }

    var updatedMatch = key.match(/^Updated\s+(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})(.*)$/);
    if (updatedMatch) {
      return 'अपडेट ' + translateDateToken(updatedMatch[1], updatedMatch[2], updatedMatch[3]) + updatedMatch[4];
    }

    var dateWithSuffixMatch = key.match(/^(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})(\s+·\s+.*)$/);
    if (dateWithSuffixMatch) {
      return translateDateToken(dateWithSuffixMatch[1], dateWithSuffixMatch[2], dateWithSuffixMatch[3]) + dateWithSuffixMatch[4];
    }

    var dateOnlyMatch = key.match(/^(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})$/);
    if (dateOnlyMatch) {
      return translateDateToken(dateOnlyMatch[1], dateOnlyMatch[2], dateOnlyMatch[3]);
    }

    return '';
  }

  function shouldSkipTranslation(el) {
    return !!(el && el.closest && el.closest([
      '[data-no-i18n]',
      '.sy-brand-header',
      '.sy-drawer__brand',
      '.sy-drawer__foot',
      '.brand-title',
      '.brand-subtitle',
      '.brand__name',
      '.brand__sub',
      '.sy-brand',
      '.sy-brand-main',
      '.sy-brand-sub',
      '.splash-title',
      '.splash-sub',
      '.profile-version'
    ].join(',')));
  }

  // Walk every text node + placeholder + the document title, swapping the
  // English source for its translation. Original English is stored on each
  // node the first time, so switching back to English restores it exactly.
  function applyTranslations(lang) {
    var dict = I18N[lang] || null;   // null => restore English
    var root = document.body;
    if (!root) return;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'CODE') return NodeFilter.FILTER_REJECT;
        // Skip transient/overlay UI
        if (p.closest && p.closest('.sy-toast')) return NodeFilter.FILTER_REJECT;
        // Brand wordmarks stay English in every language.
        if (shouldSkipTranslation(p)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);

    nodes.forEach(function (node) {
      if (node.__i18nOrig === undefined) node.__i18nOrig = node.nodeValue;
      var orig = node.__i18nOrig;
      var key = orig.trim();
      if (dict && Object.prototype.hasOwnProperty.call(dict, key)) {
        // preserve leading/trailing whitespace around the matched text
        node.nodeValue = orig.replace(key, dict[key]);
      } else if (dict) {
        var dynamicText = translateDynamicText(key, lang);
        if (dynamicText) node.nodeValue = orig.replace(key, dynamicText);
        else if (node.nodeValue !== orig) node.nodeValue = orig; // restore English
      } else if (node.nodeValue !== orig) {
        node.nodeValue = orig; // restore English
      }
    });

    // Placeholders
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(function (el) {
      if (shouldSkipTranslation(el)) return;
      if (el.__i18nPh === undefined) el.__i18nPh = el.getAttribute('placeholder') || '';
      var op = el.__i18nPh;
      var k = op.trim();
      if (dict && Object.prototype.hasOwnProperty.call(dict, k)) el.setAttribute('placeholder', dict[k]);
      else el.setAttribute('placeholder', op);
    });

    // Document <title>
    if (document.__i18nTitle === undefined) document.__i18nTitle = document.title;
    var tk = (document.__i18nTitle || '').trim();
    if (dict && Object.prototype.hasOwnProperty.call(dict, tk)) document.title = dict[tk];
    else document.title = document.__i18nTitle;
  }

  function setLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    document.documentElement.setAttribute('lang', lang);
    // refresh active state on drawer language buttons (exclude theme buttons)
    document.querySelectorAll('.sy-drawer__lang-btn[data-lang]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
    // translate the whole page
    applyTranslations(lang);
  }
  window.SY.getLang = getLang;
  window.SY.setLang = setLang;
  window.SY.applyTranslations = applyTranslations;

  var drawerHTML =
    '<div class="sy-drawer-backdrop" data-sy-drawer-close></div>' +
    '<aside class="sy-drawer" role="dialog" aria-label="Menu">' +
      '<div class="sy-drawer__head">' +
        '<button type="button" class="sy-drawer__close" data-sy-drawer-close aria-label="Close menu">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>' +
        '</button>' +
        '<div class="sy-drawer__brand" data-no-i18n>' +
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
          '<button class="sy-drawer__lang-btn" data-lang="en" type="button" title="English"><span class="lang-glyph">EN</span> English</button>' +
          '<button class="sy-drawer__lang-btn" data-lang="hi" type="button" title="Hindi"><span class="lang-glyph">हि</span> हिंदी</button>' +
        '</div>' +
      '</div>' +
      '<div class="sy-drawer__theme" role="group" aria-label="Theme">' +
        '<div class="sy-drawer__theme-label">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>' +
          '<span>Theme</span>' +
        '</div>' +
        '<div class="sy-drawer__theme-row">' +
          '<button class="sy-drawer__theme-btn" data-theme="light" type="button" aria-pressed="false" title="Light mode"><span class="theme-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.3 4.3l1.7 1.7M18 18l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.3 19.7l1.7-1.7M18 6l1.7-1.7"/></svg></span><span>Light</span></button>' +
          '<button class="sy-drawer__theme-btn" data-theme="dark" type="button" aria-pressed="false" title="Dark mode"><span class="theme-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 13.2A8.2 8.2 0 1 1 10.8 3.5a6.4 6.4 0 0 0 9.7 9.7z"/></svg></span><span>Dark</span></button>' +
        '</div>' +
      '</div>' +
      '<ul class="sy-drawer__list">' +
        drawerItem('home',              'Home',                iconHome()) +
        drawerItem('daily-prediction',  'Daily Prediction',    iconStar()) +
        drawerItem('choghadiya',        'Choghadiya',          iconClock()) +
        drawerItem('library',           'Divine Library',      iconBook()) +
        drawerItem('kundli',            'Kundli / Birth Chart', iconChart()) +
        '<div class="sy-drawer__divider"></div>' +
        drawerItem('profile',           'My Profile',          iconUser()) +
        drawerItem('notifications',     'Notifications',       iconBell()) +
        drawerItem('manage-subscription','Manage Subscription', iconCrown()) +
        drawerItem('help',              'Help & Support',      iconHelp()) +
        drawerItem('signin',            'Logout',              iconLogout()) +
      '</ul>' +
      '<div class="sy-drawer__foot" data-no-i18n>SHREE YANTRA · ASTROLOGY v1.0</div>' +
    '</aside>';

  function isActiveRoute(key) {
    return ROUTES[key] === currentFolder || (key === 'home' && currentFolder === 'welcome-page');
  }

  function drawerItem(key, label, svg) {
    var active = isActiveRoute(key);
    var activeCls = active ? ' active' : '';
    var currentAttr = active ? ' aria-current="page"' : '';
    return '<li><button type="button" class="sy-drawer__item' + activeCls + '" data-sy-go="' + key + '"' + currentAttr + '>' + svg + '<span>' + label + '</span></button></li>';
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

  var lastDrawerFocus = null;
  function openDrawer() {
    lastDrawerFocus = document.activeElement;
    document.body.classList.add('sy-no-scroll');
    document.querySelector('.sy-drawer').classList.add('open');
    document.querySelector('.sy-drawer-backdrop').classList.add('open');
    setTimeout(function () {
      var first = document.querySelector('.sy-drawer__close, .sy-drawer__item');
      if (first && first.focus) first.focus();
    }, 60);
  }
  function closeDrawer() {
    document.body.classList.remove('sy-no-scroll');
    var d = document.querySelector('.sy-drawer');
    var b = document.querySelector('.sy-drawer-backdrop');
    if (d) d.classList.remove('open');
    if (b) b.classList.remove('open');
    if (lastDrawerFocus && lastDrawerFocus.focus) {
      setTimeout(function () { try { lastDrawerFocus.focus(); } catch (_) {} }, 60);
    }
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
    'profile-page': 'profile',
    'payment': 'profile',
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
      var active = activeKey === b.key;
      var cls = active ? 'sy-bottom-nav__item active' : 'sy-bottom-nav__item';
      var currentAttr = active ? ' aria-current="page"' : '';
      return '<button type="button" class="' + cls + '" data-sy-go="' + b.key + '" aria-label="' + b.label + '"' + currentAttr + '>' + b.svg + '<span>' + b.label + '</span></button>';
    }).join('');
    return '<nav class="sy-bottom-nav" role="navigation"><div class="sy-bottom-nav__inner">' + inner + '</div></nav>';
  }

  function formatShortDate(dateObj) {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(dateObj);
  }

  function addDays(dateObj, days) {
    var copy = new Date(dateObj);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function todayParts() {
    var now = new Date();
    var date = formatShortDate(now);
    var weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(now);
    return { date: date, weekday: weekday, now: now };
  }

  function replaceFirstTextNode(el, value) {
    if (!el) return;
    var done = false;
    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (!done && node.nodeType === 3 && node.nodeValue.trim()) {
        node.nodeValue = value;
        done = true;
      }
    });
  }

  function syncLiveDates() {
    var parts = todayParts();
    document.querySelectorAll('.date-text').forEach(function (el) {
      el.textContent = 'Today, ' + parts.date;
    });
    document.querySelectorAll('.date-row strong').forEach(function (el) {
      if ((el.textContent || '').toLowerCase().indexOf('today') >= 0) {
        el.textContent = 'Today, ' + parts.date;
      }
    });
    document.querySelectorAll('#cgDateText').forEach(function (el) {
      el.textContent = parts.date + ', ' + parts.weekday;
    });
    document.querySelectorAll('.sy-muted.sy-small').forEach(function (el) {
      if (/^Updated\s+/i.test(el.textContent || '')) {
        el.textContent = 'Updated ' + parts.date + ' · Leo ♌';
      }
    });
    document.querySelectorAll('.row__label').forEach(function (el) {
      if ((el.textContent || '').trim().toLowerCase() === 'trial ends') {
        var value = el.parentElement && el.parentElement.querySelector('.row__value');
        if (value) value.textContent = formatShortDate(addDays(parts.now, 7));
      }
    });
    replaceFirstTextNode(document.querySelector('.cg-date-pill'), ' ' + parts.date + ', ' + parts.weekday + ' ');
  }

  var prefetchedRoutes = {};
  function prefetchRoute(key) {
    var folder = ROUTES[key];
    if (!folder || prefetchedRoutes[folder]) return;
    prefetchedRoutes[folder] = true;
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = pageUrl(folder);
    link.as = 'document';
    document.head.appendChild(link);
  }

  function bindRoutePrefetch() {
    function prime(e) {
      var go = e.target.closest && e.target.closest('[data-sy-go]');
      if (go) prefetchRoute(go.getAttribute('data-sy-go'));
    }
    document.addEventListener('pointerenter', prime, true);
    document.addEventListener('touchstart', prime, { passive: true, capture: true });
  }

  function bindRippleFeedback() {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    var selector = 'button, .sy-btn, .gold-btn, .sy-tile, .feature-card, .list-row, .menu-list li, .sy-bottom-nav__item, .sy-drawer__item, .lib-cat-card, .lib-music-item, .cg-row, .astro-card, .r-card';
    document.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      var target = e.target.closest && e.target.closest(selector);
      if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return;
      var rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var size = Math.max(rect.width, rect.height) * 1.9;
      var ripple = document.createElement('span');
      ripple.className = 'sy-ripple';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      target.classList.add('sy-ripple-host');
      // Anchor the ripple without disturbing layout: only static hosts need a
      // positioning context. Absolutely/relatively positioned buttons (e.g. the
      // avatar camera, .sy-btn) already provide one — leave their position alone.
      if (window.getComputedStyle(target).position === 'static') {
        target.style.position = 'relative';
      }
      target.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 680);
    }, { passive: true });
  }

  function bindNetworkStatus() {
    function sync(silent) {
      var offline = typeof navigator.onLine === 'boolean' && !navigator.onLine;
      document.body.classList.toggle('sy-offline', offline);
      if (!silent) toast(offline ? 'Offline mode active' : 'Back online', offline ? 'error' : 'success');
    }
    sync(true);
    window.addEventListener('offline', function () { sync(false); });
    window.addEventListener('online', function () { sync(false); });
  }

  // ============================================================
  // INIT — runs as soon as DOM is ready
  // ============================================================
  function init() {
    document.body.setAttribute('data-sy-shell', 'true');
    if (currentFolder) {
      document.body.classList.add('sy-page-' + currentFolder);
    }
    document.body.classList.add('sy-shell-ready');
    applyTheme(getTheme());
    syncLiveDates();
    bindRoutePrefetch();
    bindRippleFeedback();
    bindNetworkStatus();
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

      // Dedicated close handlers — bound directly to the elements so
      // they fire even if anything intercepts the global delegation.
      var directClose = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        closeDrawer();
      };
      document.querySelectorAll('[data-sy-drawer-close]').forEach(function (el) {
        el.addEventListener('click', directClose);
      });
    }

    // Industry-standard header normalization:
    // Every <header class="sy-topbar"> right-side menu button → notification bell.
    // Drawer remains accessible from the hamburger on top-level pages
    // + the edge-swipe gesture on touch.
    normalizeHeaders();

    // Apply persisted language to the drawer buttons + wire toggle
    setLang(getLang());
    setTheme(getTheme());
    var LANG_LABELS = {
      en: 'Language changed: English',
      hi: 'भाषा बदली: हिंदी'
    };
    document.querySelectorAll('.sy-drawer__lang-btn[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var lang = btn.getAttribute('data-lang');
        if (lang === getLang()) return;
        setLang(lang);
        toast(LANG_LABELS[lang] || ('Language: ' + lang), 'success');
      });
    });

    var THEME_LABELS = {
      light: 'Light mode enabled',
      dark: 'Dark mode enabled'
    };
    document.querySelectorAll('.sy-drawer__theme-btn[data-theme]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var theme = btn.getAttribute('data-theme');
        if (theme === getTheme()) return;
        setTheme(theme);
        toast(THEME_LABELS[theme] || ('Theme: ' + theme), 'success');
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
    // Pre-auth / splash pages — no drawer because the user isn't signed in
    // yet, so a hamburger leading to "Logout / My Profile / Subscription"
    // makes no sense. Add new pre-auth folders here as they're built.
    var noDrawerPages = {
      onboarding: 1,
      splash: 1,
      signin: 1,
      register: 1,
      // Checkout / subscription flow — no drawer here (industry standard:
      // a focused payment step shouldn't expose the main menu).
      'subscribenow-page': 1,
      payment: 1
    };
    var skipFloatingMenu = noDrawerPages[currentFolder];
    /* Compact theme toggle on pre-auth / checkout pages (no drawer). */
    if (skipFloatingMenu && !document.querySelector('.sy-theme-fab')) {
      var themeRow = document.createElement('div');
      themeRow.className = 'sy-theme-fab-row';
      themeRow.setAttribute('role', 'group');
      themeRow.setAttribute('aria-label', 'Theme');
      ['light', 'dark'].forEach(function (mode) {
        var tb = document.createElement('button');
        tb.type = 'button';
        tb.className = 'sy-theme-fab';
        tb.setAttribute('data-theme', mode);
        tb.setAttribute('aria-pressed', getTheme() === mode ? 'true' : 'false');
        tb.setAttribute('title', mode === 'light' ? 'Light mode' : 'Dark mode');
        tb.innerHTML = mode === 'light'
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.3 4.3l1.7 1.7M18 18l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.3 19.7l1.7-1.7M18 6l1.7-1.7"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 13.2A8.2 8.2 0 1 1 10.8 3.5a6.4 6.4 0 0 0 9.7 9.7z"/></svg>';
        if (getTheme() === mode) tb.classList.add('active');
        tb.addEventListener('click', function (e) {
          e.preventDefault();
          if (mode === getTheme()) return;
          setTheme(mode);
          toast(THEME_LABELS[mode] || ('Theme: ' + mode), 'success');
        });
        themeRow.appendChild(tb);
      });
      document.body.appendChild(themeRow);
    }
    if (!hasMenuTrigger && !hasOwnTopbar && !skipFloatingMenu) {
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

    // FAQ accordion — only one <details class="faq"> open at a time.
    // 'toggle' does not bubble, so use the capture phase.
    document.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!d || d.tagName !== 'DETAILS' || !d.classList || !d.classList.contains('faq')) return;
      if (!d.open) return;
      document.querySelectorAll('details.faq').forEach(function (other) {
        if (other !== d && other.open) other.open = false;
      });
    }, true);

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

    // Final translation pass — runs AFTER the drawer, bottom nav, headers
    // and page-specific wiring are all in the DOM, so every injected label
    // (nav items, drawer menu, brand tagline) gets translated too.
    applyTranslations(getLang());
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

    var menuSVG =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
        '<line x1="3" y1="6"  x2="21" y2="6"/>' +
        '<line x1="3" y1="12" x2="21" y2="12"/>' +
        '<line x1="3" y1="18" x2="21" y2="18"/>' +
      '</svg>';

    // Shared Shree Yantra mark — small enough to live in the header
    // alongside the SHREE YANTRA / Astrology wordmark.
    var brandLogoSVG =
      '<svg class="sy-brand-header__logo" viewBox="0 0 48 48" width="34" height="34" fill="none" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="syBrandG" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#fce8a8"/>' +
            '<stop offset="55%" stop-color="#e9b850"/>' +
            '<stop offset="100%" stop-color="#a17613"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<circle cx="24" cy="24" r="22" stroke="url(#syBrandG)" stroke-width="1"/>' +
        '<polygon points="24,7 41,36 7,36"  stroke="url(#syBrandG)" stroke-width="1.2" fill="none"/>' +
        '<polygon points="24,41 7,12 41,12" stroke="url(#syBrandG)" stroke-width="1.2" fill="none" opacity=".75"/>' +
        '<circle cx="24" cy="24" r="2.2" fill="url(#syBrandG)"/>' +
      '</svg>';

    // Wraps text-only brand markup with a side-by-side logo + text layout.
    function buildBrandHTML() {
      return brandLogoSVG +
        '<span class="sy-brand-header__text" data-no-i18n>' +
          '<span class="sy-brand-header__title">SHREE YANTRA</span>' +
          '<span class="sy-brand-header__sub">Astrology</span>' +
        '</span>';
    }

    // ---- Standard <header class="sy-topbar"> pages ----
    document.querySelectorAll('header.sy-topbar').forEach(function (hdr) {
      var titleEl = hdr.querySelector('.sy-topbar__title');

      // ---- Legacy header: [Back] [Title] [Menu] ----
      // Rewrite into the unified choghadiya/library pattern:
      // [Menu] [SHREE YANTRA brand] [Bell] + page title hero below.
      if (titleEl) {
        var pageTitle = (titleEl.textContent || '').trim();

        // Title → centered brand block with logo + wordmark.
        var brand = document.createElement('div');
        brand.className = 'sy-brand-header';
        brand.setAttribute('data-no-i18n', '');
        brand.innerHTML = buildBrandHTML();
        titleEl.replaceWith(brand);

        // Left button → menu trigger.
        var leftBtn = hdr.firstElementChild;
        if (leftBtn && leftBtn.classList && leftBtn.classList.contains('sy-topbar__btn')) {
          leftBtn.setAttribute('data-menu-toggle', '');
          leftBtn.setAttribute('aria-label', 'Menu');
          leftBtn.removeAttribute('data-sy-go');
          leftBtn.innerHTML = menuSVG;
        }

        // Right button → notification bell.
        var rightBtn = hdr.lastElementChild;
        if (rightBtn && rightBtn.classList && rightBtn.classList.contains('sy-topbar__btn')) {
          var bellWrap = document.createElement('div');
          bellWrap.innerHTML = bellButtonHTML(currentFolder === 'notifications' ? 0 : badge);
          rightBtn.replaceWith(bellWrap.firstChild);
        }

        // Inject a hero section with the page title (sparkles · CINZEL).
        var nextSibling = hdr.nextElementSibling;
        var heroExists = nextSibling && nextSibling.classList && nextSibling.classList.contains('sy-page-hero');
        if (pageTitle && !heroExists) {
          var hero = document.createElement('section');
          hero.className = 'sy-page-hero';
          hero.innerHTML =
            '<div class="sy-page-hero__title">' +
              '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>' +
              '<h2>' + pageTitle.toUpperCase() + '</h2>' +
              '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>' +
            '</div>';
          hdr.insertAdjacentElement('afterend', hero);
        }
        return;
      }

      // ---- Already brand-style headers (choghadiya, library) ----
      // Just ensure the right-side hamburger is a bell.
      var hasBell = !!hdr.querySelector('[aria-label="Notifications"]');
      if (hasBell) return;
      var menuBtn = hdr.querySelector('[data-menu-toggle], [aria-label="Menu"]');
      if (menuBtn) {
        var bell = document.createElement('div');
        bell.innerHTML = bellButtonHTML(currentFolder === 'notifications' ? 0 : badge);
        menuBtn.replaceWith(bell.firstChild);
      }
    });

    // ---- Upgrade ANY .sy-brand-header in the DOM to include the logo ----
    // Catches HTML that ships the brand block hard-coded (choghadiya,
    // library) so every page's header shows the same Shree Yantra mark
    // alongside the SHREE YANTRA / Astrology wordmark.
    document.querySelectorAll('.sy-brand-header').forEach(function (b) {
      // Wire the whole brand block to go home (welcome-page) on tap.
      // The global delegated click handler picks up data-sy-go automatically.
      if (!b.hasAttribute('data-sy-go')) b.setAttribute('data-sy-go', 'home');
      if (!b.hasAttribute('role'))       b.setAttribute('role', 'button');
      if (!b.hasAttribute('tabindex'))   b.setAttribute('tabindex', '0');
      if (!b.hasAttribute('aria-label')) b.setAttribute('aria-label', 'Go to home');
      if (b.querySelector('.sy-brand-header__logo')) return;
      var existingH1 = b.querySelector('h1');
      var existingP  = b.querySelector('p');
      var titleText = existingH1 ? existingH1.textContent.trim() : 'SHREE YANTRA';
      var subText   = existingP  ? existingP.textContent.trim()  : 'Astrology';
      b.innerHTML = brandLogoSVG +
        '<span class="sy-brand-header__text" data-no-i18n>' +
          '<span class="sy-brand-header__title">' + titleText + '</span>' +
          '<span class="sy-brand-header__sub">'   + subText   + '</span>' +
        '</span>';
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
        else if (title.indexOf('choghadiya') >= 0 || title.indexOf('muhurat') >= 0) key = 'choghadiya';
        else if (title.indexOf('library') >= 0 || title.indexOf('wisdom') >= 0) key = 'library';
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
