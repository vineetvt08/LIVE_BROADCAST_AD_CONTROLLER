import { BrandAd } from '../engine/types';

// ~52 synthetic brands across ~18 categories matching broadcast data
// Clearly labeled as SYNTHETIC DATA in UI
export const SYNTHETIC_BRANDS: BrandAd[] = [
  // --- Auto ---
  {
    id: 'maruti_suzuki',
    name: 'Maruti Suzuki',
    category: 'Auto',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1', 'Half_Time_Break_Part4'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['hyundai', 'tata_motors', 'mahindra'],
    safetyTags: ['family_safe', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Count on Us'
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    category: 'Auto',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['maruti_suzuki', 'tata_motors', 'mahindra'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Beyond Mobility'
  },
  {
    id: 'tata_motors',
    name: 'Tata Motors',
    category: 'Auto',
    availableDurations: [30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['maruti_suzuki', 'hyundai', 'mahindra'],
    safetyTags: ['needs_positive_context', 'family_safe'],
    isSynthetic: true,
    tagline: 'Connecting Aspirations'
  },
  {
    id: 'mahindra',
    name: 'Mahindra',
    category: 'Auto',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: ['maruti_suzuki', 'hyundai', 'tata_motors'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Rise'
  },

  // --- Beverage ---
  {
    id: 'coca_cola',
    name: 'Coca-Cola',
    category: 'Beverage',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['pepsi', 'thums_up', 'sprite'],
    safetyTags: ['high_energy', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Real Magic'
  },
  {
    id: 'pepsi',
    name: 'Pepsi',
    category: 'Beverage',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1', 'Half_Time_Break_Part4'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: ['coca_cola', 'thums_up', 'sprite'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Rise Up, Baby!'
  },
  {
    id: 'thums_up',
    name: 'Thums Up',
    category: 'Beverage',
    availableDurations: [30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Half_Time_Break_Part3'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['pepsi', 'coca_cola', 'sprite'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Taste the Thunder'
  },
  {
    id: 'sprite',
    name: 'Sprite',
    category: 'Beverage',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 5 },
    tier: 'Silver',
    rivalBrandIds: ['pepsi', 'coca_cola', 'thums_up'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Clear Hai!'
  },

  // --- Telecom ---
  {
    id: 'airtel',
    name: 'Airtel',
    category: 'Telecom',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['jio', 'vi'],
    safetyTags: ['family_safe', 'needs_positive_context'],
    isSynthetic: true,
    tagline: '175 Million Strong'
  },
  {
    id: 'jio',
    name: 'Jio',
    category: 'Telecom',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['airtel', 'vi'],
    safetyTags: ['high_energy', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Digital Life'
  },
  {
    id: 'vi',
    name: 'Vi',
    category: 'Telecom',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part3'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: ['airtel', 'jio'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Together for Tomorrow'
  },

  // --- Fintech ---
  {
    id: 'rupay',
    name: 'RuPay',
    category: 'Fintech',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Half_Time_Break_Part4'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['paytm', 'phonepe', 'cred'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'One Nation, One Card'
  },
  {
    id: 'paytm',
    name: 'Paytm',
    category: 'Fintech',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Half_Time_Break_Part3'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: ['phonepe', 'cred', 'rupay'],
    safetyTags: ['needs_positive_context'],
    isSynthetic: true,
    tagline: 'Paytm Karo'
  },
  {
    id: 'cred',
    name: 'CRED',
    category: 'Fintech',
    availableDurations: [30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['paytm', 'phonepe', 'rupay'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Not Everyone Gets It'
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    category: 'Fintech',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: ['paytm', 'cred', 'rupay'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Karte Ja, Badhte Ja'
  },

  // --- Travel ---
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    category: 'Travel',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Half_Time_Break_Part2'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: ['booking_com'],
    safetyTags: ['avoid_after_wicket', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Dil Toh Roaming Hai'
  },
  {
    id: 'booking_com',
    name: 'Booking.com',
    category: 'Travel',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part3'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['makemytrip'],
    safetyTags: ['avoid_after_wicket', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Booking.yeah!'
  },

  // --- Electronics ---
  {
    id: 'samsung',
    name: 'Samsung',
    category: 'Electronics',
    availableDurations: [30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break'], targetAirings: 4 },
    tier: 'Gold',
    rivalBrandIds: ['oppo', 'vivo', 'boat'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Inspire the World'
  },
  {
    id: 'oppo',
    name: 'Oppo',
    category: 'Electronics',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout'], targetAirings: 5 },
    tier: 'Silver',
    rivalBrandIds: ['vivo', 'samsung', 'boat'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Inspiration Ahead'
  },
  {
    id: 'vivo',
    name: 'Vivo',
    category: 'Electronics',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1', 'Half_Time_Break_Part4'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['oppo', 'samsung', 'boat'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Delight Every Moment'
  },
  {
    id: 'boat',
    name: 'Boat',
    category: 'Electronics',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part3'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['samsung', 'oppo', 'vivo'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Do What Floats Your boAt'
  },

  // --- Insurance ---
  {
    id: 'lic',
    name: 'LIC',
    category: 'Insurance',
    availableDurations: [30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part3'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['acko', 'policybazaar'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Zindagi Ke Saath Bhi, Zindagi Ke Baad Bhi'
  },
  {
    id: 'acko',
    name: 'ACKO',
    category: 'Insurance',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1'], targetAirings: 5 },
    tier: 'Silver',
    rivalBrandIds: ['lic', 'policybazaar'],
    safetyTags: ['needs_positive_context'],
    isSynthetic: true,
    tagline: 'Insurance Made Easy'
  },
  {
    id: 'policybazaar',
    name: 'PolicyBazaar',
    category: 'Insurance',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part4'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: ['lic', 'acko'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Har Family Hogi Insured'
  },

  // --- Ecommerce ---
  {
    id: 'flipkart',
    name: 'Flipkart',
    category: 'Ecommerce',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part3'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['amazon', 'myntra'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Har Wish Hogi Poori'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'Ecommerce',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Half_Time_Break_Part2'], targetAirings: 4 },
    tier: 'Gold',
    rivalBrandIds: ['flipkart', 'myntra'],
    safetyTags: ['family_safe', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Apni Dukan'
  },
  {
    id: 'myntra',
    name: 'Myntra',
    category: 'Ecommerce',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Half_Time_Break_Part1'], targetAirings: 5 },
    tier: 'Silver',
    rivalBrandIds: ['flipkart', 'amazon'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Be Extraordinary Everyday'
  },

  // --- Food Delivery ---
  {
    id: 'zomato',
    name: 'Zomato',
    category: 'Food_Delivery',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Half_Time_Break_Part2'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['swiggy'],
    safetyTags: ['avoid_after_wicket', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Never Have a Bad Meal'
  },
  {
    id: 'swiggy',
    name: 'Swiggy',
    category: 'Food_Delivery',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part3'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['zomato'],
    safetyTags: ['avoid_after_wicket', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Craving Something Good?'
  },

  // --- Dairy & Food ---
  {
    id: 'amul',
    name: 'Amul',
    category: 'Dairy_Food',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Half_Time_Break_Part4'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['britannia', 'cadbury'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'The Taste of India'
  },
  {
    id: 'britannia',
    name: 'Britannia',
    category: 'Dairy_Food',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 5 },
    tier: 'Silver',
    rivalBrandIds: ['amul', 'cadbury'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Eat Healthy, Think Better'
  },
  {
    id: 'cadbury',
    name: 'Cadbury',
    category: 'Dairy_Food',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['amul', 'britannia'],
    safetyTags: ['avoid_after_wicket', 'needs_positive_context', 'family_safe'],
    isSynthetic: true,
    tagline: 'Kuch Meetha Ho Jaaye'
  },

  // --- FMCG ---
  {
    id: 'vimal',
    name: 'Vimal',
    category: 'FMCG',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1', 'Half_Time_Break_Part4'], targetAirings: 6 },
    tier: 'Silver',
    rivalBrandIds: ['kamla_pasand'],
    safetyTags: ['avoid_loss_situation'],
    isSynthetic: true,
    tagline: 'Bolo Zubaan Kesari'
  },
  {
    id: 'kamla_pasand',
    name: 'Kamla Pasand',
    category: 'FMCG',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 5 },
    tier: 'Bronze',
    rivalBrandIds: ['vimal'],
    safetyTags: ['avoid_loss_situation'],
    isSynthetic: true,
    tagline: 'Anokha Swaad'
  },
  {
    id: 'surf_excel',
    name: 'Surf Excel',
    category: 'FMCG',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: [],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Daag Acche Hain'
  },

  // --- EdTech ---
  {
    id: 'unacademy',
    name: 'Unacademy',
    category: 'EdTech',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['physicswallah'],
    safetyTags: ['needs_positive_context', 'family_safe'],
    isSynthetic: true,
    tagline: 'Let\'s Crack It'
  },
  {
    id: 'physicswallah',
    name: 'PhysicsWallah',
    category: 'EdTech',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1', 'Half_Time_Break_Part4'], targetAirings: 5 },
    tier: 'Silver',
    rivalBrandIds: ['unacademy'],
    safetyTags: ['needs_positive_context'],
    isSynthetic: true,
    tagline: 'Alakh Pandey Education'
  },

  // --- Tyres ---
  {
    id: 'ceat_tyres',
    name: 'CEAT Tyres',
    category: 'Tyres',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Half_Time_Break_Part3'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['apollo_tyres', 'mrf_tyres'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Strategic Timeout Partner'
  },
  {
    id: 'apollo_tyres',
    name: 'Apollo Tyres',
    category: 'Tyres',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1'], targetAirings: 5 },
    tier: 'Silver',
    rivalBrandIds: ['ceat_tyres', 'mrf_tyres'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Go The Distance'
  },
  {
    id: 'mrf_tyres',
    name: 'MRF Tyres',
    category: 'Tyres',
    availableDurations: [30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part4'], targetAirings: 4 },
    tier: 'Gold',
    rivalBrandIds: ['ceat_tyres', 'apollo_tyres'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Pace, Power and Performance'
  },

  // --- Construction ---
  {
    id: 'ambuja_cement',
    name: 'Ambuja Cement',
    category: 'Construction',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: ['ultratech_cement'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Giant Compressive Strength'
  },
  {
    id: 'ultratech_cement',
    name: 'UltraTech Cement',
    category: 'Construction',
    availableDurations: [30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part4'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['ambuja_cement'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'The Engineer\'s Choice'
  },

  // --- Home Decor ---
  {
    id: 'asian_paints',
    name: 'Asian Paints',
    category: 'Home_Decor',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['berger_paints'],
    safetyTags: ['family_safe', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Har Ghar Kuch Kehta Hai'
  },
  {
    id: 'berger_paints',
    name: 'Berger Paints',
    category: 'Home_Decor',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part3'], targetAirings: 5 },
    tier: 'Silver',
    rivalBrandIds: ['asian_paints'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Paint Your Imagination'
  },

  // --- Gaming ---
  {
    id: 'dream11',
    name: 'Dream11',
    category: 'Gaming',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout'], targetAirings: 5 },
    tier: 'Gold',
    rivalBrandIds: ['my11circle', 'mpl'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Ye Game Hai Mahan'
  },
  {
    id: 'my11circle',
    name: 'My11Circle',
    category: 'Gaming',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout', 'Half_Time_Break_Part4'], targetAirings: 5 },
    tier: 'Silver',
    rivalBrandIds: ['dream11', 'mpl'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Play with Champions'
  },
  {
    id: 'mpl',
    name: 'MPL',
    category: 'Gaming',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part3'], targetAirings: 4 },
    tier: 'Bronze',
    rivalBrandIds: ['dream11', 'my11circle'],
    safetyTags: ['high_energy'],
    isSynthetic: true,
    tagline: 'Mobile Premier League'
  },

  // --- Channel Promo ---
  {
    id: 'hotstar_livestream_promo',
    name: 'Hotstar LiveStream Promo',
    category: 'Channel_Promo',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Half_Time_Break_Part1', 'Half_Time_Break_Part2'], targetAirings: 6 },
    tier: 'Bronze',
    rivalBrandIds: ['starsports_matchpromo', 'broadcaster_highlight_bumper'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Streaming Live in 4K'
  },
  {
    id: 'starsports_matchpromo',
    name: 'StarSports MatchPromo',
    category: 'Channel_Promo',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part3'], targetAirings: 5 },
    tier: 'Bronze',
    rivalBrandIds: ['hotstar_livestream_promo', 'broadcaster_highlight_bumper'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Believe: Cricket Ka Mahatyohar'
  },
  {
    id: 'broadcaster_highlight_bumper',
    name: 'Broadcaster Highlight Bumper',
    category: 'Channel_Promo',
    availableDurations: [15],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Wicket_Break', 'Strategic_Timeout'], targetAirings: 6 },
    tier: 'Bronze',
    rivalBrandIds: ['hotstar_livestream_promo', 'starsports_matchpromo'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Highlights on Hotstar'
  },

  // --- Personal Care ---
  {
    id: 'dove',
    name: 'Dove',
    category: 'Personal_Care',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part1', 'Half_Time_Break_Part4'], targetAirings: 6 },
    tier: 'Gold',
    rivalBrandIds: ['nivea'],
    safetyTags: ['family_safe', 'needs_positive_context'],
    isSynthetic: true,
    tagline: 'Real Beauty'
  },
  {
    id: 'nivea',
    name: 'Nivea',
    category: 'Personal_Care',
    availableDurations: [15, 30],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Over_Break', 'Strategic_Timeout', 'Half_Time_Break_Part2'], targetAirings: 4 },
    tier: 'Silver',
    rivalBrandIds: ['dove'],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Caring for Skin'
  }
];

export const BRAND_MAP = new Map<string, BrandAd>(
  SYNTHETIC_BRANDS.map(b => [b.id, b])
);

export const BRAND_NAME_MAP = new Map<string, BrandAd>(
  SYNTHETIC_BRANDS.map(b => [b.name.toLowerCase().replace(/[\s_.-]/g, ''), b])
);

// Helper to look up brand by name string flexibly
export function findBrandByName(name: string): BrandAd | undefined {
  const normalized = name.toLowerCase().replace(/[\s_.-]/g, '');
  return BRAND_NAME_MAP.get(normalized) || SYNTHETIC_BRANDS.find(b => b.id.toLowerCase() === normalized);
}
