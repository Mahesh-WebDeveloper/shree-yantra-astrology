// Birth Panchang — tithi/nakshatra/yoga/karana AT BIRTH MOMENT (from the birth chart's sidereal
// Sun & Moon longitudes — NOT sunrise). Plus masa, samvat, samvatsara. Pure/deterministic.
const TITHI = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima'];
const TITHI_HI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा'];
const NAKSHATRA = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
const NAK_HI = ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपदा', 'उत्तरा भाद्रपदा', 'रेवती'];
const YOGA = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'];
const YOGA_HI = ['विष्कम्भ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगण्ड', 'सुकर्मा', 'धृति', 'शूल', 'गण्ड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र', 'सिद्धि', 'व्यतीपात', 'वरीयान', 'परिघ', 'शिव', 'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्म', 'इन्द्र', 'वैधृति'];
const KARANA_MOV = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
const KARANA_HI = { Bava: 'बव', Balava: 'बालव', Kaulava: 'कौलव', Taitila: 'तैतिल', Gara: 'गर', Vanija: 'वणिज', Vishti: 'विष्टि (भद्रा)', Kimstughna: 'किंस्तुघ्न', Shakuni: 'शकुनि', Chatushpada: 'चतुष्पाद', Naga: 'नाग' };
const MASA = [
  { en: 'Chaitra', hi: 'चैत्र' }, { en: 'Vaishakha', hi: 'वैशाख' }, { en: 'Jyeshtha', hi: 'ज्येष्ठ' }, { en: 'Ashadha', hi: 'आषाढ़' },
  { en: 'Shravana', hi: 'श्रावण' }, { en: 'Bhadrapada', hi: 'भाद्रपद' }, { en: 'Ashwina', hi: 'आश्विन' }, { en: 'Kartika', hi: 'कार्तिक' },
  { en: 'Margashirsha', hi: 'मार्गशीर्ष' }, { en: 'Pausha', hi: 'पौष' }, { en: 'Magha', hi: 'माघ' }, { en: 'Phalguna', hi: 'फाल्गुन' },
];
const SAMVATSARA = ['Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angirasa', 'Shrimukha', 'Bhava', 'Yuva', 'Dhata', 'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vrisha', 'Chitrabhanu', 'Svabhanu', 'Tarana', 'Parthiva', 'Vyaya', 'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikriti', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi', 'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava', 'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhikrit', 'Paridhavi', 'Pramadi', 'Ananda', 'Rakshasa', 'Nala', 'Pingala', 'Kalayukti', 'Siddharthi', 'Raudra', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya'];
const norm = (x) => ((x % 360) + 360) % 360;

// sunLon, moonLon: sidereal degrees at birth; sunSignIdx: 0-11 (Aries=0); birthDate: Date
function computeBirthPanchang(sunLon, moonLon, sunSignIdx, birthDate) {
  if (sunLon == null || moonLon == null) return null;
  const nak = 360 / 27;
  const diff = norm(moonLon - sunLon);
  const sumLon = norm(sunLon + moonLon);

  const tithiNum = Math.floor(diff / 12) + 1; // 1..30
  const paksha = tithiNum <= 15 ? 'Shukla' : 'Krishna';
  const pakshaHi = tithiNum <= 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष';
  let tName = TITHI[(tithiNum - 1) % 15]; let tHi = TITHI_HI[(tithiNum - 1) % 15];
  if (tithiNum === 30) { tName = 'Amavasya'; tHi = 'अमावस्या'; }

  const nakIdx = Math.floor(moonLon / nak) % 27;
  const pada = Math.floor((moonLon % nak) / (nak / 4)) + 1;
  const yogaIdx = Math.floor(sumLon / nak) % 27;

  const kIdx = Math.floor(diff / 6);
  let kName;
  if (kIdx === 0) kName = 'Kimstughna';
  else if (kIdx >= 57) kName = ['Shakuni', 'Chatushpada', 'Naga'][kIdx - 57];
  else kName = KARANA_MOV[(kIdx - 1) % 7];

  const gy = birthDate.getFullYear(); const gm = birthDate.getMonth();
  const samvat = { vikram: gy + (gm >= 3 ? 57 : 56), shaka: gy - (gm >= 3 ? 78 : 79) };
  const samvatsara = SAMVATSARA[(((samvat.shaka + 11) % 60) + 60) % 60];
  const isKrishna = paksha === 'Krishna';
  const masa = sunSignIdx == null ? null : {
    amanta: MASA[sunSignIdx],
    purnimanta: MASA[(sunSignIdx + (isKrishna ? 1 : 0)) % 12],
  };

  return {
    tithi: { num: tithiNum, name: tName, hi: tHi, paksha, pakshaHi },
    nakshatra: { num: nakIdx + 1, name: NAKSHATRA[nakIdx], hi: NAK_HI[nakIdx], pada },
    yoga: { num: yogaIdx + 1, name: YOGA[yogaIdx], hi: YOGA_HI[yogaIdx] },
    karana: { name: kName, hi: KARANA_HI[kName] || kName },
    masa, samvat, samvatsara,
  };
}

module.exports = { computeBirthPanchang };
