'use strict';

/**
 * babyNames.js — curated, authentic Indian baby-name dataset.
 * Used as a RELIABLE fallback (and offline source) for the name engine so that
 * names ALWAYS appear even when the AI provider (Gemini) is rate-limited/down.
 * Each entry: { name, hi (Devanagari), g: 'boy'|'girl', origin, meaning, themes }.
 * Meanings are standard/verified; numerology is computed separately in code.
 */

// compact rows → expanded below. g = b(oy)/g(irl)
const B = (name, hi, meaning, themes, origin) => ({ name, hi, g: 'boy', origin: origin || 'Sanskrit', meaning, themes: themes || [] });
const G = (name, hi, meaning, themes, origin) => ({ name, hi, g: 'girl', origin: origin || 'Sanskrit', meaning, themes: themes || [] });

const NAMES = [
  // ── A ──
  B('Aarav', 'आरव', 'Peaceful; melodious sound', ['peace', 'music']),
  B('Aadi', 'आदि', 'First; most important; beginning', ['beginning']),
  B('Aayush', 'आयुष', 'Long life', ['life', 'blessing']),
  B('Arjun', 'अर्जुन', 'Bright, shining; the Pandava hero', ['strength', 'hero']),
  B('Aryan', 'आर्यन', 'Noble, honourable', ['noble']),
  B('Ansh', 'अंश', 'Part, portion (of the divine)', ['divine']),
  B('Atharv', 'अथर्व', 'The first Veda; Lord Ganesha', ['knowledge', 'deity']),
  B('Advait', 'अद्वैत', 'Unique; non-duality', ['unique']),
  B('Akshat', 'अक्षत', 'Unharmed, indestructible; sacred rice', ['strength']),
  B('Abhay', 'अभय', 'Fearless', ['courage']),
  G('Aadhya', 'आध्या', 'First power; Goddess Durga', ['goddess', 'power']),
  G('Ananya', 'अनन्या', 'Matchless, unique', ['unique']),
  G('Aarohi', 'आरोही', 'Ascending musical note', ['music', 'rising']),
  G('Anika', 'अनिका', 'Grace; Goddess Durga', ['grace', 'goddess']),
  G('Avni', 'अवनि', 'The Earth', ['earth']),
  G('Amaira', 'अमायरा', 'Beloved princess; full of grace', ['grace']),
  G('Aishwarya', 'ऐश्वर्या', 'Prosperity, wealth, grandeur', ['prosperity']),
  G('Akshara', 'अक्षरा', 'Letter, imperishable', ['knowledge']),

  // ── B ──
  B('Bhavesh', 'भवेश', 'Lord of the world; Shiva', ['deity']),
  B('Bhuvan', 'भुवन', 'The world, abode', ['world']),
  B('Brij', 'ब्रिज', 'Land of Krishna', ['deity']),
  G('Bhavya', 'भव्या', 'Grand, magnificent', ['grace']),
  G('Bhakti', 'भक्ति', 'Devotion', ['devotion']),

  // ── C ──
  B('Chirag', 'चिराग', 'Lamp, light', ['light']),
  B('Chetan', 'चेतन', 'Consciousness, life, awareness', ['life']),
  B('Charan', 'चरण', 'Holy feet', ['devotion']),
  G('Charvi', 'चार्वी', 'Beautiful woman', ['beauty']),
  G('Chitra', 'चित्रा', 'Picture; a nakshatra', ['beauty']),

  // ── D ──
  B('Dev', 'देव', 'God, divine', ['divine', 'deity']),
  B('Daksh', 'दक्ष', 'Capable, talented; a Prajapati', ['strength']),
  B('Darsh', 'दर्श', 'Sight; Lord Krishna', ['deity']),
  B('Dhruv', 'ध्रुव', 'Pole star; constant, immovable', ['star', 'steadfast']),
  B('Dhairya', 'धैर्य', 'Patience, courage', ['courage']),
  G('Diya', 'दीया', 'Lamp, light', ['light']),
  G('Drishti', 'दृष्टि', 'Vision, sight', ['vision']),
  G('Devyani', 'देवयानी', 'Beloved of the gods', ['divine']),

  // ── E ──
  B('Eshan', 'ईशान', 'Lord Shiva; the sun; north-east', ['deity']),
  G('Esha', 'ईशा', 'Desire; Goddess Parvati', ['goddess']),
  G('Ela', 'एला', 'Earth; cardamom', ['earth']),

  // ── G ──
  B('Gaurav', 'गौरव', 'Pride, honour', ['honour']),
  B('Girish', 'गिरीश', 'Lord of the mountains; Shiva', ['deity']),
  B('Gautam', 'गौतम', 'Enlightened one; the Buddha', ['knowledge']),
  G('Gauri', 'गौरी', 'Fair; Goddess Parvati', ['goddess']),
  G('Gunjan', 'गुंजन', 'Humming of a bee', ['music']),

  // ── H ──
  B('Harsh', 'हर्ष', 'Joy, happiness', ['joy']),
  B('Hari', 'हरि', 'Lord Vishnu', ['deity']),
  B('Hriday', 'हृदय', 'Heart', ['love']),
  B('Hitesh', 'हितेश', 'Lord of goodness', ['goodness']),
  G('Hiya', 'हिया', 'Heart', ['love']),
  G('Hansika', 'हंसिका', 'Swan; melodious', ['grace']),

  // ── I ──
  B('Ishan', 'ईशान', 'The sun; Lord Shiva', ['deity', 'light']),
  B('Indra', 'इंद्र', 'King of the gods', ['deity']),
  G('Ira', 'इरा', 'Goddess Saraswati; the earth', ['goddess']),
  G('Ishita', 'ईशिता', 'Mastery, supremacy; desired', ['power']),
  G('Inaya', 'इनाया', 'Gift, concern, care', ['blessing'], 'Persian'),

  // ── J ──
  B('Jay', 'जय', 'Victory', ['victory']),
  B('Japan', 'जपन', 'Chanting the Lord’s name', ['devotion']),
  B('Jivin', 'जीविन', 'Full of life', ['life']),
  G('Jiya', 'जिया', 'Heart, sweetheart', ['love']),
  G('Janvi', 'जान्हवी', 'River Ganga', ['purity']),

  // ── K ──
  B('Krishna', 'कृष्ण', 'Dark; the divine cowherd, Lord Krishna', ['deity']),
  B('Kabir', 'कबीर', 'Great; the saint-poet', ['greatness'], 'Hindu'),
  B('Karan', 'करण', 'Instrument; the warrior Karna', ['hero']),
  B('Kunal', 'कुणाल', 'Lotus; son of Emperor Ashoka', ['beauty']),
  B('Keshav', 'केशव', 'Lord Krishna; one with fine hair', ['deity']),
  G('Kavya', 'काव्य', 'Poetry', ['knowledge', 'beauty']),
  G('Kiara', 'कियारा', 'Dark-haired; bright', ['beauty']),
  G('Kashvi', 'काश्वी', 'Shining, beautiful', ['beauty']),
  G('Kriti', 'कृति', 'Creation, work of art', ['beauty']),

  // ── L ──
  B('Laksh', 'लक्ष', 'Aim, target', ['focus']),
  B('Lakshya', 'लक्ष्य', 'Aim, goal', ['focus']),
  G('Lavanya', 'लावण्य', 'Grace, beauty', ['grace', 'beauty']),
  G('Lakshmi', 'लक्ष्मी', 'Goddess of wealth and fortune', ['goddess', 'prosperity']),

  // ── M ──
  B('Manish', 'मनीष', 'Lord of the mind; intelligent', ['knowledge']),
  B('Mohit', 'मोहित', 'Enchanted, fascinated', ['charm']),
  B('Mayank', 'मयंक', 'The moon', ['moon']),
  B('Madhav', 'माधव', 'Lord Krishna; sweet like honey', ['deity']),
  B('Mukund', 'मुकुंद', 'Lord Vishnu; giver of liberation', ['deity']),
  G('Myra', 'मायरा', 'Beloved, sweet', ['love']),
  G('Meera', 'मीरा', 'Devotee of Krishna; prosperous', ['devotion']),
  G('Mahi', 'मही', 'The Earth', ['earth']),
  G('Manya', 'मान्या', 'Worthy of honour', ['honour']),

  // ── N ──
  B('Nakul', 'नकुल', 'A Pandava prince; mongoose', ['hero']),
  B('Naman', 'नमन', 'Salutation, bowing in respect', ['humility']),
  B('Nirav', 'निरव', 'Quiet, calm', ['peace']),
  G('Navya', 'नव्या', 'Young, new, worth praising', ['new']),
  G('Nitya', 'नित्या', 'Eternal, constant', ['eternal']),
  G('Naina', 'नैना', 'Eyes', ['beauty']),

  // ── O ──
  B('Om', 'ओम', 'The sacred primordial sound', ['divine']),
  B('Ojas', 'ओजस', 'Vital energy, lustre', ['strength']),
  G('Ojaswini', 'ओजस्विनी', 'Lustrous, full of vitality', ['strength']),

  // ── P ──
  B('Pranav', 'प्रणव', 'The sacred syllable Om', ['divine']),
  B('Parth', 'पार्थ', 'Arjuna; son of Pritha', ['hero']),
  B('Pranay', 'प्रणय', 'Love, romance', ['love']),
  B('Prem', 'प्रेम', 'Love, affection', ['love']),
  G('Pari', 'परी', 'Fairy, angel', ['grace']),
  G('Prisha', 'प्रिषा', 'Beloved; God’s gift', ['love', 'blessing']),
  G('Priya', 'प्रिया', 'Beloved, dear', ['love']),
  G('Pihu', 'पीहू', 'Sweet sound of a peacock', ['music']),

  // ── R ──
  B('Reyansh', 'रेयांश', 'Ray of light; part of Lord Vishnu', ['light', 'deity']),
  B('Rohan', 'रोहन', 'Ascending, growing; sandalwood', ['rising']),
  B('Rudra', 'रुद्र', 'Lord Shiva', ['deity']),
  B('Rishi', 'ऋषि', 'A sage, seer', ['knowledge']),
  B('Raghav', 'राघव', 'Lord Rama; descendant of Raghu', ['deity']),
  G('Riya', 'रिया', 'Singer; graceful', ['music', 'grace']),
  G('Riddhi', 'ऋद्धि', 'Prosperity; consort of Ganesha', ['prosperity']),
  G('Roshni', 'रोशनी', 'Light, brightness', ['light']),
  G('Rachana', 'रचना', 'Creation', ['beauty']),

  // ── S ──
  B('Shaurya', 'शौर्य', 'Bravery, valour', ['courage']),
  B('Sai', 'साई', 'Divine; saint', ['divine']),
  B('Samar', 'समर', 'War; reward', ['strength']),
  B('Shiv', 'शिव', 'Lord Shiva; auspicious', ['deity']),
  B('Sarthak', 'सार्थक', 'Meaningful, worthwhile', ['purpose']),
  B('Suryansh', 'सूर्यांश', 'Part of the Sun', ['light', 'strength']),
  G('Saanvi', 'सान्वी', 'Goddess Lakshmi', ['goddess']),
  G('Siya', 'सिया', 'Goddess Sita', ['goddess']),
  G('Sara', 'सारा', 'Pure, essence', ['purity']),
  G('Shreya', 'श्रेया', 'Auspicious; the best; Goddess Lakshmi', ['goddess', 'auspicious']),
  G('Sneha', 'स्नेहा', 'Love, affection', ['love']),
  G('Suhana', 'सुहाना', 'Pleasant, beautiful', ['beauty']),

  // ── T ──
  B('Tejas', 'तेजस', 'Brilliance, radiance', ['light', 'strength']),
  B('Tanish', 'तनिष', 'Ambition; God', ['ambition']),
  B('Tarun', 'तरुण', 'Young, youthful', ['youth']),
  G('Tara', 'तारा', 'Star', ['star']),
  G('Tanvi', 'तन्वी', 'Slender, beautiful; Goddess Durga', ['beauty', 'goddess']),
  G('Trisha', 'त्रिशा', 'Desire, thirst', ['desire']),

  // ── U ──
  B('Utkarsh', 'उत्कर्ष', 'Advancement, prosperity', ['prosperity']),
  B('Udit', 'उदित', 'Risen, grown', ['rising']),
  G('Urvi', 'उर्वी', 'The Earth', ['earth']),
  G('Uma', 'उमा', 'Goddess Parvati', ['goddess']),

  // ── V ──
  B('Vivaan', 'विवान', 'Full of life; rays of the morning sun', ['life', 'light']),
  B('Vihaan', 'विहान', 'Dawn, morning', ['light']),
  B('Ved', 'वेद', 'Sacred knowledge', ['knowledge']),
  B('Veer', 'वीर', 'Brave, warrior', ['courage', 'hero']),
  B('Vivek', 'विवेक', 'Wisdom, discrimination', ['knowledge']),
  G('Vanya', 'वान्या', 'Of the forest; gracious gift of God', ['nature']),
  G('Vaishnavi', 'वैष्णवी', 'Goddess Lakshmi; worshipper of Vishnu', ['goddess']),
  G('Vidhi', 'विधि', 'Destiny; Goddess Saraswati', ['goddess']),

  // ── Y ──
  B('Yug', 'युग', 'An era, age', ['eternal']),
  B('Yash', 'यश', 'Fame, glory, success', ['fame']),
  B('Yuvraj', 'युवराज', 'Crown prince', ['royalty']),
  G('Yashvi', 'यशवी', 'Famous, successful', ['fame']),
  G('Yamini', 'यामिनी', 'Night', ['night']),
];

module.exports = { NAMES };
