'use strict';

/**
 * drik2050.fixture.js — Drik Panchang's 2050 calendar for Jodhpur (26.2389 N, 73.0243 E,
 * +05:30). A FAR-FUTURE spot-check: the major festivals only, no monthly vrats.
 *
 * The point of this year is drift. 2026 and 2027 sit close enough together that several
 * distinct rules agree on them; a quarter-century out they stop agreeing, and a rule that was
 * only ever curve-fitted to the near years shows itself. That is exactly what happened —
 * Raksha Bandhan and Krishna Janmashtami both broke here, and both turned out to be governed
 * by a factor (Bhadra; the Ashtami-Rohini yoga) that 2026/2027 simply never exercised.
 *
 * Transcribed from Drik's own 2050 Jodhpur festival calendar (geoname-id 1268865); the two
 * repaired festivals were additionally cross-checked against Drik's dedicated Raksha Bandhan
 * and Krishna Janmashtami pages, which print the Purnima/Ashtami spans, the Bhadra window and
 * the Rohini nakshatra span.
 *
 * Key namespace is ours, dates are Drik's (see drik2027.fixture.js for the amanta/purnimanta
 * note on Purnima and Amavasya keys).
 */

// [date DD/MM, key, basis, opts?]
const F = (date, key, basis, opts = {}) => ({ date: `${date}/2050`, key, basis, ...opts });

module.exports = [
  // ── JANUARY ──
  F('03/01', 'ekadashi-putrada-paush', 'Paush Shukla Ekadashi'),
  F('07/01', 'purnima-paush', 'Paush Shukla Purnima'),
  F('11/01', 'sakat-chauth', 'Magha Krishna Chaturthi — moonrise'),
  F('15/01', 'sankranti-makara', 'Sun enters sidereal Capricorn — Punya Kaal day'),
  F('15/01', 'makar-sankranti', 'Makar Sankranti Punya Kaal'),
  F('15/01', 'pongal', 'Makar Sankranti day'),
  F('19/01', 'ekadashi-shattila', 'Paush Krishna Ekadashi'),
  F('23/01', 'mauni-amavasya', 'Paush Krishna Amavasya'),
  F('27/01', 'vasant-panchami', 'Magha Shukla Panchami'),
  F('29/01', 'ratha-saptami', 'Magha Shukla Saptami'),
  F('30/01', 'bhishma-ashtami', 'Magha Shukla Ashtami'),

  // ── FEBRUARY ──
  F('02/02', 'ekadashi-jaya', 'Magha Shukla Ekadashi'),
  F('06/02', 'purnima-magha', 'Magha Shukla Purnima'),
  F('13/02', 'sankranti-kumbha', 'Sun enters sidereal Aquarius'),
  F('18/02', 'ekadashi-vijaya', 'Magha Krishna Ekadashi'),
  F('20/02', 'maha-shivaratri', 'Magha Krishna Chaturdashi — nishita'),
  F('21/02', 'somavati-amavasya', 'Amavasya at sunrise falling on a Monday'),

  // ── MARCH ──
  F('04/03', 'ekadashi-amalaki', 'Phalguna Shukla Ekadashi'),
  F('08/03', 'holika-dahan', 'Phalguna Purnima — pradosh window'),
  F('09/03', 'holi', 'day after Holika Dahan'),
  F('15/03', 'sankranti-meena', 'Sun enters sidereal Pisces'),
  F('16/03', 'shitala-ashtami', 'Phalguna Krishna Ashtami'),
  F('19/03', 'ekadashi-papamochani', 'Phalguna Krishna Ekadashi'),
  F('23/03', 'ugadi', 'Chaitra Shukla Pratipada'),
  F('23/03', 'gudi-padwa', 'Chaitra Shukla Pratipada'),
  F('23/03', 'chaitra-navratri', 'Chaitra Shukla Pratipada'),
  F('25/03', 'gangaur', 'Chaitra Shukla Tritiya'),
  F('31/03', 'ram-navami', 'Chaitra Shukla Navami — madhyahna'),

  // ── APRIL ──
  F('02/04', 'ekadashi-kamada', 'Chaitra Shukla Ekadashi'),
  F('07/04', 'hanuman-jayanti', 'Chaitra Shukla Purnima'),
  F('07/04', 'purnima-chaitra', 'Chaitra Shukla Purnima'),
  F('14/04', 'sankranti-mesha', 'Sun enters sidereal Aries'),
  F('14/04', 'baisakhi', 'Mesha Sankranti day'),
  F('17/04', 'ekadashi-varuthini', 'Chaitra Krishna Ekadashi'),
  F('24/04', 'akshaya-tritiya', 'Vaishakha Shukla Tritiya — strict madhyahna-vyapini'),

  // ── MAY ──
  F('02/05', 'ekadashi-mohini', 'Vaishakha Shukla Ekadashi'),
  F('05/05', 'narasimha-jayanti', 'Vaishakha Shukla Chaturdashi — sayankala'),
  F('06/05', 'buddha-purnima', 'Vaishakha Shukla Purnima'),
  F('06/05', 'purnima-vaishakha', 'Vaishakha Shukla Purnima'),
  F('15/05', 'sankranti-vrishabha', 'Sun enters sidereal Taurus'),
  F('17/05', 'ekadashi-apara', 'Vaishakha Krishna Ekadashi'),
  F('20/05', 'vat-savitri', 'Vaishakha Krishna Amavasya'),

  // ── JUNE ──
  F('01/06', 'ekadashi-nirjala', 'Jyeshtha Shukla Ekadashi'),
  F('05/06', 'purnima-jyeshtha', 'Jyeshtha Shukla Purnima'),
  F('15/06', 'sankranti-mithuna', 'Sun enters sidereal Gemini'),
  F('21/06', 'jagannath-rathyatra', 'Ashadha Shukla Dwitiya'),

  // ── JULY ──
  F('01/07', 'ekadashi-devshayani', 'Ashadha Shukla Ekadashi'),
  F('04/07', 'guru-purnima', 'Ashadha Shukla Purnima'),
  F('04/07', 'purnima-ashadha', 'Ashadha Shukla Purnima'),
  F('14/07', 'ekadashi-kamika', 'Ashadha Krishna Ekadashi'),
  F('16/07', 'sankranti-karka', 'Sun enters sidereal Cancer — Punya Kaal day'),
  F('22/07', 'hariyali-teej', 'Shravana Shukla Tritiya'),
  F('24/07', 'nag-panchami', 'Shravana Shukla Panchami'),

  // ── AUGUST ──
  // THE two rows that broke the engine. Purnima runs 02/08 11:19 → 03/08 07:50, so Bhadra (the
  // Vishti karana = its first half) ends 21:35 on the 2nd — before that day's Pradosh closes at
  // 21:48. The rakhi can therefore still be tied on the 2nd, and Drik keeps it there, even
  // though the 3rd is the sunrise-Purnima day. A plain sunrise rule says the 3rd.
  F('02/08', 'raksha-bandhan', 'Shravana Purnima — Bhadra clears at 21:35, inside the 2nd\'s Pradosh'),
  F('03/08', 'purnima-shravana', 'Shravana Shukla Purnima — sunrise'),
  // Ashtami runs 09/08 10:52 → 10/08 09:54; Rohini only begins 11/08 05:34. The two NEVER
  // overlap, so there is no Ashtami-Rohini yoga and the day reverts to the Nishita rule — the
  // 9th, whose midnight the Ashtami holds. A plain sunrise rule says the 10th.
  F('09/08', 'krishna-janmashtami', 'Shravana Krishna Ashtami — no Rohini overlap, so Nishita decides'),
  F('17/08', 'sankranti-simha', 'Sun enters sidereal Leo'),
  F('30/08', 'onam', 'Sun in Leo and Shravana nakshatra'),

  // ── SEPTEMBER ──
  F('17/09', 'sankranti-kanya', 'Sun enters sidereal Virgo'),
  F('17/09', 'vishwakarma-puja', 'Kanya Sankranti day'),
  F('19/09', 'hartalika-teej', 'Bhadrapada Shukla Tritiya'),
  F('20/09', 'ganesh-chaturthi', 'Bhadrapada Shukla Chaturthi — madhyahna'),
  F('29/09', 'anant-chaturdashi', 'Bhadrapada Shukla Chaturdashi'),

  // ── OCTOBER ──
  F('16/10', 'navratri-start', 'Ashwina Shukla Pratipada'),
  F('16/10', 'ghatasthapana', 'Ashwina Shukla Pratipada'),
  F('17/10', 'sankranti-tula', 'Sun enters sidereal Libra'),
  F('23/10', 'durga-ashtami', 'Ashwina Shukla Ashtami'),
  F('25/10', 'vijayadashami', 'Ashwina Shukla Dashami — aparahna'),
  F('29/10', 'sharad-purnima', 'Ashwina Shukla Purnima — nishita'),

  // ── NOVEMBER ──
  F('02/11', 'karwa-chauth', 'Ashwina Krishna Chaturthi — moonrise'),
  F('11/11', 'dhanteras', 'Ashwina Krishna Trayodashi — pradosh'),
  F('14/11', 'diwali', 'Ashwina Krishna Amavasya — pradosh'),
  F('15/11', 'govardhan-puja', 'Kartika Shukla Pratipada — sayankala'),
  F('16/11', 'bhai-dooj', 'Kartika Shukla Dwitiya — aparahna'),
  F('16/11', 'sankranti-vrishchika', 'Sun enters sidereal Scorpio'),
  F('20/11', 'chhath-puja', 'Kartika Shukla Shashthi — sayankala'),
  F('25/11', 'tulsi-vivah', 'Kartika Shukla Dwadashi — sunrise'),
  F('28/11', 'kartik-purnima', 'Kartika Shukla Purnima'),
  F('28/11', 'purnima-kartika', 'Kartika Shukla Purnima'),

  // ── DECEMBER ──
  F('16/12', 'sankranti-dhanu', 'Sun enters sidereal Sagittarius'),
  F('24/12', 'ekadashi-mokshada', 'Margashirsha Shukla Ekadashi'),
  F('28/12', 'purnima-margashirsha', 'Margashirsha Shukla Purnima'),
];
