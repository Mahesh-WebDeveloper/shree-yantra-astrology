/**
 * App translations — English + Hindi.
 * Naya string add karna ho to dono (en + hi) me key daal do.
 * t(key, fallback) missing key par fallback (ya English) dikhata hai.
 */
export type Lang = 'en' | 'hi';

export const STRINGS: Record<string, { en: string; hi: string }> = {
  // ── bottom tabs ──
  'tab.home': { en: 'Home', hi: 'होम' },
  'tab.choghadiya': { en: 'Choghadiya', hi: 'चौघड़िया' },
  'tab.kundli': { en: 'Kundli', hi: 'कुंडली' },
  'tab.library': { en: 'Library', hi: 'पुस्तकालय' },
  'tab.profile': { en: 'Profile', hi: 'प्रोफ़ाइल' },

  // ── common actions ──
  'common.save': { en: 'Save', hi: 'सहेजें' },
  'common.saveChanges': { en: 'Save Changes', hi: 'बदलाव सहेजें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.continue': { en: 'Continue', hi: 'आगे बढ़ें' },
  'common.back': { en: 'Back', hi: 'वापस' },
  'common.ok': { en: 'OK', hi: 'ठीक है' },
  'common.signIn': { en: 'Sign In', hi: 'साइन इन' },
  'common.logout': { en: 'Logout', hi: 'लॉग आउट' },
  'common.viewAll': { en: 'View All', hi: 'सभी देखें' },
  'common.readMore': { en: 'Read More', hi: 'और पढ़ें' },
  'common.loading': { en: 'Loading…', hi: 'लोड हो रहा है…' },

  // ── drawer / nav ──
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.dailyPrediction': { en: 'My Rashifal', hi: 'मेरा राशिफल' },
  'nav.panchang': { en: 'Panchang', hi: 'पंचांग' },
  'nav.janamPatri': { en: 'Janam Patri', hi: 'जन्म पत्रिका' },
  'nav.brihatKundli': { en: 'Brihat Kundli', hi: 'बृहत कुंडली' },
  'nav.babyNames': { en: 'Baby Names', hi: 'बच्चे का नाम' },
  'nav.aiAstrologer': { en: 'Vedic Astrologer', hi: 'ज्योतिषी जी' },
  'nav.kundli': { en: 'Kundli', hi: 'कुंडली' },
  'nav.choghadiya': { en: 'Choghadiya', hi: 'चौघड़िया' },
  'nav.library': { en: 'Library', hi: 'पुस्तकालय' },
  'nav.predictions': { en: 'Rashifal · 12 Signs', hi: 'राशिफल · 12 राशियाँ' },
  'nav.profile': { en: 'My Profile', hi: 'मेरी प्रोफ़ाइल' },
  'nav.subscription': { en: 'Manage Subscription', hi: 'सदस्यता प्रबंधन' },
  'nav.notifications': { en: 'Notifications', hi: 'सूचनाएँ' },
  'nav.help': { en: 'Help & Support', hi: 'सहायता' },
  'nav.settings': { en: 'Settings', hi: 'सेटिंग्स' },
  'drawer.language': { en: 'Language', hi: 'भाषा' },
  'drawer.theme': { en: 'Theme', hi: 'थीम' },
  'drawer.namaste': { en: 'Namaste', hi: 'नमस्ते' },

  // ── profile ──
  'profile.myInfo': { en: 'My Information', hi: 'मेरी जानकारी' },
  'profile.account': { en: 'Account', hi: 'खाता' },
  'profile.preferences': { en: 'Preferences', hi: 'प्राथमिकताएँ' },
  'profile.editProfile': { en: 'Edit Profile', hi: 'प्रोफ़ाइल संपादित करें' },
  'profile.fullName': { en: 'Full Name', hi: 'पूरा नाम' },
  'profile.dob': { en: 'Date of Birth', hi: 'जन्म तिथि' },
  'profile.tob': { en: 'Time of Birth', hi: 'जन्म समय' },
  'profile.place': { en: 'Place of Birth', hi: 'जन्म स्थान' },
  'profile.email': { en: 'Email', hi: 'ईमेल' },
  'profile.mobile': { en: 'Mobile', hi: 'मोबाइल' },
  'profile.premiumMember': { en: 'PREMIUM MEMBER', hi: 'प्रीमियम सदस्य' },
  'profile.freeMember': { en: 'FREE MEMBER', hi: 'मुफ़्त सदस्य' },
  'edit.personal': { en: 'Personal Details', hi: 'व्यक्तिगत विवरण' },
  'edit.birthDetails': { en: 'Birth Details', hi: 'जन्म विवरण' },

  // ── auth ──
  'auth.enterMobile': { en: 'Enter Mobile', hi: 'मोबाइल नंबर डालें' },
  'auth.verifyOtp': { en: 'Verify OTP', hi: 'OTP सत्यापित करें' },
  'auth.sendOtp': { en: 'SEND OTP', hi: 'OTP भेजें' },
  'auth.mobileNumber': { en: 'Mobile Number', hi: 'मोबाइल नंबर' },

  // ── home / welcome ──
  'home.greeting': { en: 'Welcome', hi: 'स्वागत है' },
  'home.dailyHoroscope': { en: 'Your Daily Horoscope', hi: 'आपका दैनिक राशिफल' },
  'home.readFull': { en: 'Read Full Prediction', hi: 'पूरा राशिफल पढ़ें' },
  'home.viewDetails': { en: 'View Details', hi: 'विस्तार से देखें' },
  'home.todaysPrediction': { en: "TODAY'S PREDICTION", hi: 'आज का राशिफल' },
  'home.exploreFeatures': { en: 'Explore Premium Features', hi: 'प्रीमियम सुविधाएँ देखें' },
  'home.today': { en: 'Today', hi: 'आज' },
  'home.lucky': { en: 'Lucky', hi: 'शुभ अंक' },
  'home.goodTime': { en: 'good time', hi: 'शुभ समय' },
  'home.feat.pred.title': { en: 'My Rashifal', hi: 'मेरा राशिफल' },
  'home.feat.pred.desc': { en: 'YOUR personal horoscope — daily, weekly, monthly & yearly from your birth chart', hi: 'आपका व्यक्तिगत राशिफल — अपनी जन्म कुंडली से दैनिक, साप्ताहिक, मासिक व वार्षिक' },
  'home.feat.horoscope.title': { en: 'Rashifal · 12 Signs', hi: 'राशिफल · 12 राशियाँ' },
  'home.feat.horoscope.desc': { en: "Today's horoscope for any of the 12 zodiac signs (yourself or family)", hi: 'किसी भी राशि का आज का राशिफल (अपना या परिवार का)' },
  'home.feat.ai.title': { en: 'Vedic Astrologer', hi: 'ज्योतिषी जी' },
  'home.feat.ai.desc': { en: 'Ask personal questions using your chart and precise planetary data', hi: 'अपनी कुंडली और सटीक ग्रह डेटा के आधार पर प्रश्न पूछें' },
  'home.feat.kundli.title': { en: 'Kundli / Birth Chart', hi: 'कुंडली / जन्म कुंडली' },
  'home.feat.kundli.desc': { en: 'View your detailed birth chart and planetary positions', hi: 'अपनी विस्तृत जन्म कुंडली और ग्रहों की स्थिति देखें' },
  'home.feat.chog.title': { en: 'Choghadiya Muhurat', hi: 'चौघड़िया मुहूर्त' },
  'home.feat.chog.desc': { en: 'Find auspicious timings for important work and decisions', hi: 'महत्वपूर्ण कार्यों के लिए शुभ मुहूर्त जानें' },

  // ── auth (mobile + OTP) ──
  'auth.enterMobileSub': { en: "We'll send a one-time code to verify your number", hi: 'आपके नंबर की पुष्टि के लिए हम एक OTP भेजेंगे' },
  'auth.otpSentTo': { en: 'Code sent to', hi: 'OTP भेजा गया' },
  'auth.verifyContinue': { en: 'VERIFY & CONTINUE', hi: 'पुष्टि करें और आगे बढ़ें' },
  'auth.verifying': { en: 'VERIFYING…', hi: 'पुष्टि हो रही है…' },
  'auth.sending': { en: 'SENDING…', hi: 'भेजा जा रहा है…' },
  'auth.resendOtp': { en: 'Resend OTP', hi: 'OTP दोबारा भेजें' },
  'auth.resendIn': { en: 'Resend OTP in', hi: 'दोबारा भेजें' }, // "... 25s"
  'auth.useEmail': { en: 'Continue with Email & Password', hi: 'ईमेल और पासवर्ड से जारी रखें' },
  'auth.or': { en: 'OR', hi: 'या' },
  'auth.terms': { en: 'By continuing you agree to our Terms & Privacy Policy.', hi: 'आगे बढ़कर आप हमारी शर्तें और गोपनीयता नीति स्वीकार करते हैं।' },

  // ── birth details onboarding ──
  'birth.title': { en: 'YOUR BIRTH DETAILS', hi: 'आपके जन्म विवरण' },
  'birth.lead': { en: 'Just once — these make your kundli, panchang and predictions 100% accurate.', hi: 'सिर्फ़ एक बार — इनसे आपकी कुंडली, पंचांग और भविष्यवाणियाँ बिल्कुल सटीक बनती हैं।' },
  'birth.gender': { en: 'GENDER', hi: 'लिंग' },
  'birth.continueApp': { en: 'Continue to App', hi: 'ऐप में जाएँ' },

  // ── choghadiya ──
  'cg.special': { en: "TODAY'S SPECIAL MESSAGE", hi: 'आज का विशेष संदेश' },
  'cg.upcoming': { en: 'UPCOMING AUSPICIOUS TIMINGS', hi: 'आने वाले शुभ मुहूर्त' },
  'cg.activities': { en: 'WHICH CHOGHADIYA IS BEST FOR WHICH ACTIVITY?', hi: 'कौन-सा चौघड़िया किस काम के लिए शुभ है?' },
  'cg.todays': { en: "TODAY'S CHOGHADIYA", hi: 'आज का चौघड़िया' },
  'cg.currentlyActive': { en: 'CURRENTLY ACTIVE', hi: 'अभी चल रहा है' },
  'cg.dayBegins': { en: 'DAY BEGINS WITH', hi: 'दिन की शुरुआत' },
  'cg.left': { en: 'LEFT', hi: 'शेष' },
  'cg.duration': { en: 'DURATION', hi: 'अवधि' },
  'cg.calToday': { en: 'TODAY', hi: 'आज' },
  'cg.calConfirm': { en: 'CONFIRM', hi: 'पुष्टि' },
  'cg.now': { en: 'NOW', hi: 'अभी' },

  // ── daily prediction ──
  'dp.cosmicMood': { en: "Today's Cosmic Mood", hi: 'आज का ग्रह-भाव' },
  'dp.timings': { en: 'Auspicious Timings', hi: 'शुभ समय' },
  'dp.remedies': { en: 'Suggested Remedies', hi: 'सुझाए गए उपाय' },
  'dp.moreInsights': { en: 'More Insights', hi: 'और जानकारी' },
  'dp.luckyColour': { en: 'Lucky Colour', hi: 'शुभ रंग' },
  'dp.luckyNumber': { en: 'Lucky Number', hi: 'शुभ अंक' },
  'dp.save': { en: 'SAVE', hi: 'सहेजें' },
  'dp.saved': { en: 'SAVED', hi: 'सहेजा गया' },
  'dp.share': { en: 'SHARE PREDICTION', hi: 'राशिफल साझा करें' },
  'dp.moonBased': { en: 'Moon sign based guidance', hi: 'चंद्र राशि आधारित मार्गदर्शन' },
  'dp.personalising': { en: 'Personalising your day...', hi: 'आपका दिन तैयार हो रहा है...' },
  'dp.sourceTag': { en: 'Chart + Panchang', hi: 'कुंडली + पंचांग' },
  'dp.aiFallback': { en: 'Estimated guidance', hi: 'अनुमानित मार्गदर्शन' },
  'dp.confidence': { en: 'Confidence', hi: 'विश्वास स्तर' },
  'dp.astroBasis': { en: 'Astro Basis', hi: 'ज्योतिष आधार' },
  'dp.moonSign': { en: 'Moon Sign', hi: 'चंद्र राशि' },
  'dp.lagna': { en: 'Lagna', hi: 'लग्न' },
  'dp.dasha': { en: 'Dasha', hi: 'दशा' },
  'dp.nakshatra': { en: 'Nakshatra', hi: 'नक्षत्र' },
  'dp.panchang': { en: "Today's Panchang", hi: 'आज का पंचांग' },
  'dp.panchangEmpty': { en: 'Panchang will appear after your birth place and network data are available.', hi: 'जन्म स्थान और नेटवर्क डेटा उपलब्ध होने पर पंचांग दिखेगा।' },
  'dp.bestTiming': { en: 'Best Timing Today', hi: 'आज का श्रेष्ठ समय' },
  'dp.doAvoid': { en: 'Do And Avoid', hi: 'क्या करें और क्या न करें' },
  'dp.do': { en: 'Do', hi: 'करें' },
  'dp.avoid': { en: 'Avoid', hi: 'बचें' },
  'dp.askAi': { en: 'Ask the Astrologer', hi: 'ज्योतिषी से पूछें' },
  'dp.askAiLead': { en: "These questions will use your saved birth details, today's precise astrology data, and the current language mode.", hi: 'ये प्रश्न आपकी सहेजी हुई जन्म जानकारी, आज के सटीक ज्योतिष डेटा और वर्तमान भाषा मोड का उपयोग करेंगे।' },
  'dp.openAi': { en: 'OPEN ASTROLOGER', hi: 'ज्योतिषी खोलें' },
  'dp.source': { en: 'Source | ', hi: 'स्रोत | ' },

  // ── Vedic Astrologer (astrologer chat) ──
  'ai.title': { en: 'Vedic Astrologer', hi: 'ज्योतिषी जी' },
  'ai.heroTitle': { en: 'Chart-Grounded Answers', hi: 'कुंडली आधारित उत्तर' },
  'ai.heroText': { en: 'Ask about today, kundli, dasha, timing, relationships, career, remedies, or spiritual guidance.', hi: 'आज, कुंडली, दशा, समय, संबंध, करियर, उपाय या आध्यात्मिक मार्गदर्शन के बारे में पूछें।' },
  'ai.sourceLead': { en: 'Your answer is prepared from your saved birth details and precise chart & panchang calculations.', hi: 'आपका उत्तर आपकी सहेजी हुई जन्म जानकारी और सटीक कुंडली व पंचांग गणना से तैयार किया जाता है।' },
  'ai.askLabel': { en: 'Ask your question', hi: 'अपना प्रश्न पूछें' },
  'ai.placeholder': { en: 'Type your question...', hi: 'अपना प्रश्न लिखें...' },
  'ai.asking': { en: 'ASKING...', hi: 'पूछा जा रहा है...' },
  'ai.askButton': { en: 'ASK ASTROLOGER', hi: 'ज्योतिषी से पूछें' },
  'ai.emptyTitle': { en: 'Personal guidance starts here', hi: 'व्यक्तिगत मार्गदर्शन यहां शुरू होता है' },
  'ai.emptyText': { en: 'For best results, complete your birth date, birth time, and birth place in profile. The app will use that context automatically.', hi: 'बेहतर परिणाम के लिए प्रोफाइल में जन्म तिथि, जन्म समय और जन्म स्थान पूरा करें। ऐप उस संदर्भ का उपयोग अपने आप करेगा।' },
  'ai.question': { en: 'Question', hi: 'प्रश्न' },
  'ai.loading': { en: "Reading your chart and today's panchang...", hi: 'आपकी कुंडली और आज का पंचांग पढ़ा जा रहा है...' },
  'ai.answer': { en: 'Answer', hi: 'उत्तर' },
  'ai.basis': { en: 'Calculation basis', hi: 'गणना का आधार' },
  'ai.remedies': { en: 'Suggested remedies', hi: 'सुझाए गए उपाय' },
  'ai.defaultSource': { en: 'Based on your precise birth chart and Panchang data.', hi: 'आपकी सटीक जन्म कुंडली और पंचांग डेटा पर आधारित।' },
  'ai.quick.today': { en: 'What should I focus on today?', hi: 'आज मुझे किस पर ध्यान देना चाहिए?' },
  'ai.quick.time': { en: 'Which time is better for important work?', hi: 'महत्वपूर्ण काम के लिए कौन सा समय बेहतर है?' },
  'ai.quick.dasha': { en: 'What does my current dasha mean?', hi: 'मेरी वर्तमान दशा का क्या अर्थ है?' },
  'ai.quick.remedy': { en: 'Suggest a simple remedy for today.', hi: 'आज के लिए कोई सरल उपाय बताएं।' },

  // ── help ──
  'help.faq': { en: 'Frequently Asked Questions', hi: 'अक्सर पूछे जाने वाले प्रश्न' },
  'help.emailSupport': { en: 'Email support', hi: 'ईमेल सहायता' },
  'help.call': { en: 'Call helpline', hi: 'हेल्पलाइन पर कॉल' },
  'help.chat': { en: 'Live Chat', hi: 'लाइव चैट' },
  'help.kb': { en: 'Knowledge Base', hi: 'जानकारी केंद्र' },

  // ── subscribe ──
  'sub.unlock': { en: 'Unlock Premium Predictions & Remedies', hi: 'प्रीमियम राशिफल और उपाय अनलॉक करें' },
  'sub.cta': { en: 'SUBSCRIBE NOW', hi: 'अभी सब्सक्राइब करें' },
  'sub.secure': { en: '100% Secure', hi: '100% सुरक्षित' },
  'sub.secureSub': { en: 'Your data is safe with us', hi: 'आपका डेटा हमारे पास सुरक्षित है' },
  'sub.accurate': { en: 'Accurate Prediction', hi: 'सटीक भविष्यवाणी' },
  'sub.accurateSub': { en: 'Based on Vedic Astrology', hi: 'वैदिक ज्योतिष पर आधारित' },
  'sub.support': { en: 'Premium Support', hi: 'प्रीमियम सहायता' },
  'sub.supportSub': { en: 'Dedicated support for you', hi: 'आपके लिए समर्पित सहायता' },

  // ── notifications ──
  'notif.allCaught': { en: "You're all caught up", hi: 'सब कुछ पढ़ लिया गया' },
  'notif.markAll': { en: 'MARK ALL AS READ', hi: 'सभी पढ़ा हुआ करें' },
  'notif.unread': { en: 'unread', hi: 'अपठित' },
  'notif.today': { en: 'TODAY', hi: 'आज' },
  'notif.yesterday': { en: 'YESTERDAY', hi: 'कल' },
  'notif.earlier': { en: 'EARLIER', hi: 'पहले' },

  // ── sign in ──
  'signin.welcomeBack': { en: 'WELCOME BACK', hi: 'वापसी पर स्वागत है' },
  'signin.lead': { en: 'Sign in to continue your cosmic journey', hi: 'अपनी ज्योतिषीय यात्रा जारी रखने के लिए साइन इन करें' },
  'signin.emailOrMobile': { en: 'Email or Mobile', hi: 'ईमेल या मोबाइल' },
  'signin.password': { en: 'Password', hi: 'पासवर्ड' },
  'signin.rememberMe': { en: 'Remember me', hi: 'मुझे याद रखें' },
  'signin.forgot': { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?' },
  'signin.orContinue': { en: 'OR CONTINUE WITH', hi: 'या इससे जारी रखें' },
  'signin.newUser': { en: 'New to Shree Yantra?', hi: 'Shree Yantra पर नए हैं?' },
  'signin.createAccount': { en: 'Create Account', hi: 'खाता बनाएँ' },
  'reg.title': { en: 'CREATE DIVINE PROFILE', hi: 'अपना खाता बनाएँ' },
  'reg.identity': { en: 'Your Cosmic Identity', hi: 'आपकी पहचान' },
  'reg.identityLead': { en: 'Tell us how the universe should greet you.', hi: 'हमें बताएँ कि हम आपको कैसे संबोधित करें।' },
  'reg.createPassword': { en: 'Create Password', hi: 'पासवर्ड बनाएँ' },
  'reg.alreadyHave': { en: 'Already have an account? ', hi: 'पहले से खाता है? ' },
  'reg.createAccount': { en: 'Create Account', hi: 'खाता बनाएँ' },
  'reg.creating': { en: 'Creating…', hi: 'बनाया जा रहा है…' },

  // ── kundli page ──
  'kundli.birthChart': { en: 'YOUR BIRTH CHART', hi: 'आपकी जन्म कुंडली' },
  'kundli.ascendant': { en: 'Ascendant', hi: 'लग्न' },
  'kundli.lagna': { en: 'Lagna', hi: 'लग्न' },
  'kundli.north': { en: 'North', hi: 'उत्तर' },
  'kundli.south': { en: 'South', hi: 'दक्षिण' },
  'kundli.east': { en: 'East', hi: 'पूर्व' },
  'kundli.swipeHint': { en: '← Swipe to change chart →', hi: '← स्वाइप करके चार्ट बदलें →' },
  'kundli.tapHint': { en: 'tap to enlarge', hi: 'टैप करके बड़ा करें' },
  'kundli.chartTitle': { en: 'Birth Chart', hi: 'जन्म कुंडली' },
  'kundli.reset': { en: 'RESET', hi: 'रीसेट' },
  'kundli.zoomHint': { en: 'Pinch to zoom · drag to move · double-tap to reset', hi: 'पिंच ज़ूम · खींचकर घुमाएँ · डबल-टैप रीसेट' },
  'kundli.shareTitle': { en: 'Kundli Chart', hi: 'कुंडली चार्ट' },

  // ── Kundli Milan (Gun Milan) ──
  'match.title': { en: 'Kundli Milan', hi: 'कुंडली मिलान' },
  'match.heading': { en: 'Gun Milan', hi: 'गुण मिलान' },
  'match.sub': { en: 'Marriage compatibility by the 36-guna Ashtakoot method — real chart calculation with simple explanation.', hi: '36 गुण अष्टकूट विधि से शादी की अनुकूलता जानें — असली कुंडली गणना के साथ सरल व्याख्या।' },
  'match.entrySub': { en: '36-guna matching — check marriage compatibility', hi: '36 गुण मिलान — शादी की अनुकूलता जानें' },
  'match.boy': { en: 'Groom (Boy)', hi: 'वर (लड़का)' },
  'match.girl': { en: 'Bride (Girl)', hi: 'वधू (लड़की)' },
  'match.cta': { en: 'Match Kundli', hi: 'कुंडली मिलाएँ' },
  'match.again': { en: 'Match Another', hi: 'दूसरा मिलान करें' },

  // ── Gochar (Transits) ──
  'gochar.title': { en: 'Gochar · Transits', hi: 'गोचर' },
  'gochar.heading': { en: "Today's Transits", hi: 'आज का गोचर' },
  'gochar.entrySub': { en: 'Where planets are now — Sade Sati & key transits', hi: 'अभी ग्रह कहाँ — साढ़े साती व मुख्य गोचर' },

  // ── Panchang ──
  'panchang.title': { en: 'Panchang', hi: 'पंचांग' },

  // ── Vedic Reading (classical phala-kathan) ──
  'reading.title': { en: 'Vedic Reading', hi: 'वैदिक फलादेश' },
  'reading.heading': { en: 'Traditional Reading', hi: 'पारंपरिक फलादेश' },
  'reading.entrySub': { en: 'Gana-Yoni-Nadi, Gandmool, Rajyogas & classical readings', hi: 'गण-योनि-नाड़ी, गण्डमूल, राजयोग व शास्त्रीय फलादेश' },

  // ── Life Timeline (Vimshottari Dasha) ──
  'timeline.title': { en: 'Life Timeline', hi: 'जीवन दशा-काल' },
  'timeline.heading': { en: 'Vimshottari Dasha', hi: 'विंशोत्तरी दशा' },
  'timeline.entrySub': { en: 'Which dasha at which age — why, benefits & cautions', hi: 'किस उम्र में कौन सी दशा — कारण, लाभ, सावधानी' },

  // ── Janam Patri + Naamkaran ──
  'patri.title': { en: 'Janam Patri', hi: 'जन्म पत्रिका' },
  'patri.heading': { en: 'Create Janam Patri', hi: 'जन्म पत्रिका बनाएँ' },
  'patri.cta': { en: 'Generate Janam Patri', hi: 'जन्म पत्रिका बनाएँ' },
  'patri.pdf': { en: '📄 Export Full Janam Patri PDF', hi: '📄 पूरी जन्म पत्रिका PDF' },

  // ── Year-by-year Transit Forecast ──
  'forecast.title': { en: 'Year Forecast', hi: 'साल-दर-साल गोचर' },
  'forecast.heading': { en: 'Year-by-Year Forecast', hi: 'साल-दर-साल गोचर-फल' },
  'forecast.entrySub': { en: 'Year-by-year Sade Sati & Jupiter transit effects', hi: 'साल-दर-साल साढ़े साती व गुरु गोचर का फल' },

  // ── Baby Names ──
  'babynames.title': { en: 'Baby Names', hi: 'बच्चे का नाम' },
  'babynames.heading': { en: 'Find a Baby Name', hi: 'बच्चे का नाम खोजें' },
  'babynames.cta': { en: 'Suggest Names', hi: 'नाम सुझाएँ' },

  // ── Remedies (Upaay) ──
  'rem.title': { en: 'Remedies · Upaay', hi: 'उपाय' },
  'rem.heading': { en: 'Your Remedies', hi: 'आपके उपाय' },
  'rem.entrySub': { en: 'Lucky gemstone, dosha remedies & graha mantras', hi: 'भाग्य रत्न, दोष उपाय व नवग्रह मंत्र' },

  // ── AI voice ──
  'ai.voiceHint': { en: '🎤 Use your keyboard mic to ask by voice · tap "Listen" to hear the answer aloud', hi: '🎤 कीबोर्ड के माइक से बोलकर भी प्रश्न पूछें · उत्तर "सुनें" दबाकर सुन भी सकते हैं' },
  'kundli.moonIn': { en: 'Moon in', hi: 'चंद्र राशि' },
  'kundli.loading': { en: 'Loading live chart…', hi: 'कुंडली लोड हो रही है…' },
  'kundli.offline': { en: 'Offline — showing demo data', hi: 'ऑफ़लाइन — डेमो डेटा' },
  'kundli.live': { en: 'LIVE · real planetary data', hi: 'लाइव · वास्तविक ग्रह डेटा' },
  'kundli.calculated': { en: 'Calculated from your birth details and precise planetary positions', hi: 'आपकी जन्म जानकारी और सटीक ग्रह स्थिति से गणना' },
  'kundli.metaDob': { en: 'DOB', hi: 'जन्म तिथि' },
  'kundli.metaTime': { en: 'Time', hi: 'समय' },
  'kundli.metaPlace': { en: 'Place', hi: 'स्थान' },
  'kundli.keyInsights': { en: 'KEY INSIGHTS', hi: 'मुख्य बातें' },
  'kundli.planetaryPositions': { en: 'PLANETARY POSITIONS', hi: 'ग्रहों की स्थिति' },
  'kundli.currentDasha': { en: 'CURRENT DASHA', hi: 'वर्तमान दशा' },
  'kundli.vimshottari': { en: 'VIMSHOTTARI TIMELINE', hi: 'विंशोत्तरी समयरेखा' },
  'kundli.auspiciousYogas': { en: 'AUSPICIOUS YOGAS', hi: 'शुभ योग' },
  'kundli.doshaCheck': { en: 'DOSHA CHECK', hi: 'दोष जाँच' },
  'kundli.running': { en: 'Running', hi: 'चल रही' },
  'kundli.unlock': { en: 'Unlock Full Analysis', hi: 'पूरा विश्लेषण अनलॉक करें' },
  'kundli.divisionalCharts': { en: 'DIVISIONAL CHARTS', hi: 'विभागीय कुंडली' },
  'kundli.coreCharts': { en: 'Essential charts', hi: 'मुख्य चार्ट' },
  'kundli.advancedCharts': { en: 'Advanced charts', hi: 'उन्नत चार्ट' },
  'kundli.showAdvanced': { en: 'SHOW ADVANCED CHARTS', hi: 'उन्नत चार्ट दिखाएँ' },
  'kundli.hideAdvanced': { en: 'HIDE ADVANCED CHARTS', hi: 'उन्नत चार्ट छिपाएँ' },
  'kundli.chartLoading': { en: 'Preparing divisional charts...', hi: 'विभागीय कुंडली तैयार हो रही है...' },
  'kundli.chartUnavailable': { en: 'Divisional charts are unavailable right now.', hi: 'विभागीय कुंडली अभी उपलब्ध नहीं है।' },
  'kundli.askChartAi': { en: 'Explain this', hi: 'विस्तार से समझें' },
  'kundli.whatItShows': { en: 'What it shows', hi: 'यह क्या दिखाता है' },
  'kundli.level.core': { en: 'Core', hi: 'मुख्य' },
  'kundli.level.advanced': { en: 'Advanced', hi: 'उन्नत' },
  'kundli.level.expert': { en: 'Expert', hi: 'विशेषज्ञ' },

  // ── kundli tabs ──
  'kundli.tab.overview': { en: 'OVERVIEW', hi: 'सारांश' },
  'kundli.tab.charts': { en: 'CHARTS', hi: 'चार्ट' },
  'kundli.tab.planets': { en: 'PLANETS', hi: 'ग्रह' },
  'kundli.tab.dasha': { en: 'DASHA', hi: 'दशा' },
  'kundli.tab.yoga': { en: 'YOGA', hi: 'योग' },
  'kundli.tab.dosha': { en: 'DOSHA', hi: 'दोष' },

  // ── library filters ──
  'lib.filter.all': { en: 'ALL', hi: 'सभी' },
  'lib.filter.mantras': { en: 'MANTRAS', hi: 'मंत्र' },
  'lib.filter.scriptures': { en: 'SCRIPTURES', hi: 'ग्रंथ' },
  'lib.filter.music': { en: 'MUSIC', hi: 'संगीत' },
  'lib.filter.saved': { en: 'SAVED', hi: 'सहेजे' },

  // ── profile menu rows ──
  'menu.Edit Profile': { en: 'Edit Profile', hi: 'प्रोफ़ाइल संपादित करें' },
  'menu.Notifications': { en: 'Notifications', hi: 'सूचनाएँ' },
  'menu.Manage Subscription': { en: 'Manage Subscription', hi: 'सदस्यता प्रबंधन' },
  'menu.Saved Library': { en: 'Saved Library', hi: 'सहेजी लाइब्रेरी' },
  'menu.Language': { en: 'Language', hi: 'भाषा' },
  'menu.Privacy & Security': { en: 'Privacy & Security', hi: 'गोपनीयता और सुरक्षा' },
  'menu.Help & Support': { en: 'Help & Support', hi: 'सहायता और समर्थन' },

  // ── privacy & security ──
  'ps.protected': { en: 'Your data is protected', hi: 'आपका डेटा सुरक्षित है' },
  'ps.protectedSub': { en: 'Manage how you sign in, what you share, and your account data — all in one place.', hi: 'आप कैसे साइन इन करते हैं, क्या साझा करते हैं और अपना डेटा — सब एक जगह।' },
  'ps.security': { en: 'Security', hi: 'सुरक्षा' },
  'ps.privacy': { en: 'Privacy', hi: 'गोपनीयता' },
  'ps.data': { en: 'Data & Policies', hi: 'डेटा और नीतियाँ' },
  'ps.danger': { en: 'Danger Zone', hi: 'खतरनाक क्षेत्र' },

  // ── manage subscription ──
  'ms.title': { en: 'Manage Plan', hi: 'प्लान प्रबंधन' },
  'ms.billing': { en: 'Billing', hi: 'बिलिंग' },

  // ── Bhagavad Gita ──
  'gita.title': { en: 'Bhagavad Gita', hi: 'भगवद् गीता' },
  'gita.subtitle': { en: '18 Chapters · 700 Verses', hi: '18 अध्याय · 700 श्लोक' },
  'gita.chapter': { en: 'Chapter', hi: 'अध्याय' },
  'gita.verses': { en: 'verses', hi: 'श्लोक' },
  'gita.verse': { en: 'Verse', hi: 'श्लोक' },
  'gita.summary': { en: 'Chapter Summary', hi: 'अध्याय सारांश' },
  'gita.translation': { en: 'Translation', hi: 'अनुवाद' },
  'gita.transliteration': { en: 'Transliteration', hi: 'उच्चारण' },
  'gita.read': { en: 'Read', hi: 'पढ़ें' },

  // ── Ramayana ──
  'ram.title': { en: 'Valmiki Ramayana', hi: 'वाल्मीकि रामायण' },
  'ram.subtitle': { en: 'Sanskrit & English · 7 Kanda', hi: 'संस्कृत व अंग्रेज़ी · 7 कांड' },
  'ram.sargas': { en: 'Sargas', hi: 'सर्ग' },
  'ram.sarga': { en: 'Sarga', hi: 'सर्ग' },
  'ram.shloka': { en: 'Shloka', hi: 'श्लोक' },
  'ram.shlokas': { en: 'shlokas', hi: 'श्लोक' },
  'ram.audioTitle': { en: 'Ramayan Audio Katha', hi: 'रामायण ऑडियो कथा' },
  'ram.audioCta': { en: 'Hindi · Listen (121 episodes)', hi: 'हिंदी · सुनें (121 episodes)' },
  'ram.audioSub': { en: 'Hindi · {n} episodes', hi: 'हिंदी · {n} एपिसोड' },
  'ram.audioErr': { en: 'Audio could not load — please check your internet.', hi: 'ऑडियो लोड नहीं हो पाया — इंटरनेट जाँचें।' },

  // ── Ramcharitmanas (Tulsidas) ──
  'rcm.title': { en: 'Ramcharitmanas', hi: 'श्रीरामचरितमानस' },
  'rcm.subtitle': { en: 'Hindi · 7 Kand · 1074 Verses', hi: 'हिंदी · 7 कांड · 1074 छंद' },
  'rcm.author': { en: 'Goswami Tulsidas · Awadhi', hi: 'गोस्वामी तुलसीदास · अवधी' },
  'rcm.verses': { en: 'verses', hi: 'छंद' },
  'rcm.loadMore': { en: 'Load more', hi: 'और देखें' },
  'rcm.loadErr': { en: 'Content could not load — please check your internet.', hi: 'सामग्री लोड नहीं हो पाई — इंटरनेट जाँचें।' },
  // ── Rigveda ──
  'rig.title': { en: 'Rigveda', hi: 'ऋग्वेद' },
  'rig.subtitle': { en: 'Sanskrit & English · 10 Mandala', hi: 'संस्कृत व अंग्रेज़ी · 10 मंडल' },
  'rig.mandala': { en: 'Mandala', hi: 'मंडल' },
  'rig.mandalas': { en: 'Mandalas', hi: 'मंडल' },
  'rig.suktas': { en: 'Suktas', hi: 'सूक्त' },
  'rig.sukta': { en: 'Sukta', hi: 'सूक्त' },
  'rig.mantra': { en: 'Mantra', hi: 'मंत्र' },
  'rig.mantras': { en: 'mantras', hi: 'मंत्र' },
  'rig.loadErr': { en: 'Content could not load — please check your internet.', hi: 'सामग्री लोड नहीं हो पाई — इंटरनेट जाँचें।' },
  'rig.hindiAnuvad': { en: 'हिंदी अनुवाद', hi: 'हिंदी अनुवाद' },

  // ── AI verse explanation (reusable: Gita, Ramayan, Ramcharitmanas, …) ──
  'ai.showMeaning': { en: 'See meaning in Hindi', hi: 'हिंदी में अर्थ जानें' },
  'ai.hideMeaning': { en: 'Hide Hindi meaning', hi: 'हिंदी अर्थ छिपाएँ' },
  'ai.anuvad': { en: 'Meaning', hi: 'अर्थ' },
  'ai.katha': { en: 'Story', hi: 'कथा' },
  'ai.seekh': { en: 'Lesson', hi: 'सीख' },
  'ai.meaningErr': { en: 'Could not load the meaning — please try again.', hi: 'अर्थ लोड नहीं हो पाया — फिर प्रयास करें।' },
  'ai.aiNote': { en: 'Detailed explanation', hi: 'विस्तृत व्याख्या' },

  // ── Gita chapter audio (Yatharth Geeta) ──
  'gita.audioListen': { en: 'Listen to this chapter', hi: 'इस अध्याय को सुनें' },
  'gita.audioPlaying': { en: 'Playing this chapter…', hi: 'अध्याय चल रहा है…' },
  'gita.audioBy': { en: 'Yatharth Geeta · Swami Adgadanand', hi: 'यथार्थ गीता · स्वामी अड़गड़ानंद' },

  // ── Library — Gita audio ──
  'lib.gitaAudio': { en: 'BHAGAVAD GITA AUDIO', hi: 'श्रीमद्भगवद्गीता ऑडियो' },
  'lib.gitaAudioHint': { en: 'Yatharth Geeta · Swami Adgadanand · Hindi — tap to listen, auto-plays next.', hi: 'यथार्थ गीता · स्वामी अड़गड़ानंद · हिंदी — सुनने के लिए टैप करें, अगला अपने आप चलेगा।' },

  // ── Daily Spiritual Boost ──
  'daily.boostLabel': { en: "TODAY'S SPIRITUAL BOOST", hi: 'आज का आध्यात्मिक संदेश' },
  'daily.todayShloka': { en: "Today's Shloka", hi: 'आज का श्लोक' },
  'daily.learnMore': { en: 'Learn more', hi: 'विस्तार से जानें' },
  'daily.title': { en: 'Daily Shloka', hi: 'आज का श्लोक' },
  'daily.generating': { en: 'Preparing explanation…', hi: 'व्याख्या तैयार हो रही है…' },
  'daily.err': { en: 'Could not load the explanation — please try again.', hi: 'व्याख्या लोड नहीं हो पाई — फिर प्रयास करें।' },
  'daily.anuvad': { en: 'Meaning', hi: 'अर्थ' },
  'daily.vyakhya': { en: 'Detailed Explanation', hi: 'विस्तृत व्याख्या' },
  'daily.jeevan': { en: 'In Daily Life', hi: 'आज के जीवन में' },
  'daily.seekh': { en: "Today's Message", hi: 'आज का संदेश' },
  'daily.readFull': { en: 'Read full chapter', hi: 'पूरा अध्याय पढ़ें' },

  // ── misc ──
  'choghadiya.day': { en: 'Day', hi: 'दिन' },
  'choghadiya.night': { en: 'Night', hi: 'रात' },
};
