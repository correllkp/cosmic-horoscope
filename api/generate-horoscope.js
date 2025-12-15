// api/generate-horoscope-advanced.js
// Enhanced with Rosicrucian astrology concepts

import { GoogleGenerativeAI } from '@google/generative-ai';

const cache = new Map();

// Critical Degrees by sign type
const CRITICAL_DEGREES = {
  cardinal: [1, 13, 26], // Aries, Cancer, Libra, Capricorn
  fixed: [9, 21],        // Taurus, Leo, Scorpio, Aquarius
  common: [4, 17]        // Gemini, Virgo, Sagittarius, Pisces
};

// Sign classifications
const SIGN_QUALITIES = {
  cardinal: ['Aries', 'Cancer', 'Libra', 'Capricorn'],
  fixed: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'],
  common: ['Gemini', 'Virgo', 'Sagittarius', 'Pisces']
};

// Essential Dignities for Sun
const SUN_DIGNITIES = {
  exalted: 'Aries',    // Strongest
  ruling: 'Leo',       // Very strong
  detriment: 'Aquarius', // Challenged
  fall: 'Libra'        // Weakest
};

// Check if degree is critical
function isCriticalDegree(sign, degree) {
  const quality = Object.keys(SIGN_QUALITIES).find(q => 
    SIGN_QUALITIES[q].includes(sign)
  );
  
  if (!quality) return false;
  
  const criticalDegs = CRITICAL_DEGREES[quality];
  const degreeInt = Math.floor(degree);
  
  return criticalDegs.some(cd => Math.abs(cd - degreeInt) <= 2);
}

// Get Sun's essential dignity
function getSunDignity(sign) {
  if (sign === SUN_DIGNITIES.exalted) return 'exalted';
  if (sign === SUN_DIGNITIES.ruling) return 'ruling';
  if (sign === SUN_DIGNITIES.detriment) return 'detriment';
  if (sign === SUN_DIGNITIES.fall) return 'fall';
  return 'neutral';
}

// Calculate natal Sun from birth date
function calculateNatalSun(birthDate) {
  const parts = birthDate.split('-');
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  const zodiacRanges = [
    { sign: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
    { sign: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
    { sign: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
    { sign: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
    { sign: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
    { sign: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
    { sign: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
    { sign: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
    { sign: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
    { sign: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
    { sign: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
    { sign: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
  ];
  
  for (const range of zodiacRanges) {
    const inRange = 
      (month === range.start.month && day >= range.start.day) ||
      (month === range.end.month && day <= range.end.day) ||
      (range.start.month < range.end.month && month > range.start.month && month < range.end.month);
    
    if (inRange) {
      let dayOfSign;
      if (month === range.start.month) {
        dayOfSign = day - range.start.day + 1;
      } else {
        const daysInFirstMonth = 30 - range.start.day;
        dayOfSign = daysInFirstMonth + day;
      }
      
      const degree = Math.min(29, dayOfSign);
      
      // Check if critical degree
      const isCritical = isCriticalDegree(range.sign, degree);
      
      // Get essential dignity
      const dignity = getSunDignity(range.sign);
      
      return {
        sign: range.sign,
        degree: degree.toFixed(1),
        exactPosition: `${range.sign} ${degree.toFixed(1)}°`,
        isCritical: isCritical,
        dignity: dignity
      };
    }
  }
  
  return null;
}

// Simple current planetary positions (approximate)
function getCurrentPlanetaryInfluences() {
  const today = new Date();
  const month = today.getMonth() + 1;
  
  // Approximate Moon phase
  const dayOfMonth = today.getDate();
  let moonPhase;
  if (dayOfMonth <= 7) moonPhase = 'New Moon';
  else if (dayOfMonth <= 14) moonPhase = 'First Quarter';
  else if (dayOfMonth <= 21) moonPhase = 'Full Moon';
  else moonPhase = 'Last Quarter';
  
  // Approximate Mercury retrograde (simplified - would need ephemeris for accuracy)
  // Mercury goes retrograde ~3 times/year for ~3 weeks
  const isLateInYear = month >= 11;
  const mercuryRx = isLateInYear; // Simplified
  
  return {
    moonPhase,
    mercuryRetrograde: mercuryRx,
    currentMonth: today.toLocaleDateString('en-US', { month: 'long' })
  };
}

function getCacheKey(signName, birthDate, date) {
  const birthKey = birthDate ? `-${birthDate}` : '';
  return `${signName}${birthKey}-${date}`;
}

function isCacheValid(cacheEntry) {
  if (!cacheEntry) return false;
  const now = Date.now();
  const age = now - cacheEntry.timestamp;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  return age < ONE_DAY;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 2000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const is503 = error.message?.includes('503') || 
                    error.message?.includes('overloaded') ||
                    error.message?.includes('UNAVAILABLE');
      if (is503 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sign, timeframe = 'daily', birthDate = null } = req.body;

    if (!sign || !sign.name) {
      return res.status(400).json({ error: 'Sign information is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = getCacheKey(sign.name, birthDate, today);
    const cachedEntry = cache.get(cacheKey);

    if (isCacheValid(cachedEntry)) {
      console.log(`Cache HIT for ${sign.name}`);
      return res.status(200).json({
        horoscope: cachedEntry.horoscopes[timeframe],
        personalized: !!birthDate,
        natalSun: cachedEntry.natalSun,
        cached: true,
        generatedAt: new Date(cachedEntry.timestamp).toISOString()
      });
    }

    console.log(`Cache MISS - generating horoscope`);

    // Calculate natal Sun with advanced features
    let natalSun = null;
    let personalized = false;
    
    if (birthDate) {
      try {
        natalSun = calculateNatalSun(birthDate);
        personalized = true;
        console.log(`Personalized: ${natalSun.exactPosition}, Critical: ${natalSun.isCritical}, Dignity: ${natalSun.dignity}`);
      } catch (error) {
        console.warn('Birth date calculation failed:', error);
      }
    }
    
    // Get current planetary influences
    const currentInfluences = getCurrentPlanetaryInfluences();

    // Generate horoscopes
    const allHoroscopes = await retryWithBackoff(async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          maxOutputTokens: 16384,
          temperature: 0.9,
        }
      });

      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      // Build advanced personalization section
      let advancedContext = '';
      if (personalized && natalSun) {
        advancedContext = `
===ADVANCED ASTROLOGICAL ANALYSIS===

NATAL SUN POSITION: ${natalSun.exactPosition}

${natalSun.isCritical ? `
**CRITICAL DEGREE ALERT!**
Your natal Sun is at a CRITICAL DEGREE (${natalSun.degree}°). According to Rosicrucian astrology, 
this amplifies your Sun's power significantly. Critical degrees make planetary influences 3-5x stronger.

For you as an inventor:
- Innovation breakthroughs are more dramatic
- Patent filings have stronger cosmic backing
- Investor presentations carry exceptional impact
- R&D insights are more profound
` : ''}

${natalSun.dignity !== 'neutral' ? `
**ESSENTIAL DIGNITY: ${natalSun.dignity.toUpperCase()}**

${natalSun.dignity === 'exalted' ? `
Your Sun is EXALTED in ${natalSun.sign}! This is the strongest possible position.
- Leadership in innovation comes naturally
- Patent strategies are exceptionally effective
- Funding opportunities align with your vision
- Technical problem-solving is at peak capacity
` : ''}

${natalSun.dignity === 'ruling' ? `
Your Sun RULES ${natalSun.sign}! This gives exceptional strength.
- Natural authority in your field
- Patent applications proceed smoothly
- Investors recognize your expertise immediately
- Innovation projects succeed with less resistance
` : ''}

${natalSun.dignity === 'detriment' ? `
Your Sun is in DETRIMENT in ${natalSun.sign}. This creates challenges that build strength.
- Innovation requires extra persistence
- Patent process may face obstacles (overcome with determination)
- Collaboration helps offset solo challenges
- Long-term success through resilience
` : ''}

${natalSun.dignity === 'fall' ? `
Your Sun is in FALL in ${natalSun.sign}. This position teaches through adversity.
- Innovation path requires strategic partnerships
- Patent protection needs extra diligence
- Team-based approaches work better than solo efforts
- Success comes through balancing your vision with others' input
` : ''}
` : ''}

CURRENT COSMIC WEATHER:
- Moon Phase: ${currentInfluences.moonPhase}
${currentInfluences.moonPhase === 'New Moon' ? '  → Ideal for starting new projects, filing patents' : ''}
${currentInfluences.moonPhase === 'First Quarter' ? '  → Building momentum, develop prototypes' : ''}
${currentInfluences.moonPhase === 'Full Moon' ? '  → Peak visibility, launch products, present to investors' : ''}
${currentInfluences.moonPhase === 'Last Quarter' ? '  → Review, refine, prepare documentation' : ''}

${currentInfluences.mercuryRetrograde ? `
- Mercury Retrograde: Communication delays likely
  → Double-check patent paperwork
  → Expect investor meeting reschedules
  → Review (don't submit) contracts
` : '- Mercury Direct: Clear communication for contracts and patents'}

Use this astrological intelligence to time your innovation activities for maximum success.`;
      }

      const prompt = `Generate THREE integrated horoscopes for ${sign.name}.

TODAY'S DATE: ${dateStr}
CURRENT INFLUENCES: ${currentInfluences.moonPhase} in ${currentInfluences.currentMonth}

${personalized ? advancedContext : 'Generic horoscope based on zodiac sign only.'}

These horoscopes are for INVENTORS and ENTREPRENEURS.

Include sections:
**Innovation & Product Development**
**Patent & IP Protection**
**Commercialization & Funding**
**Strategic Planning**
**Inventor's Personal Growth**

${personalized && natalSun?.isCritical ? 'IMPORTANT: Emphasize that this is a CRITICAL DEGREE power week/month with amplified opportunities.' : ''}

${personalized && natalSun?.dignity === 'exalted' ? 'IMPORTANT: Reference their EXALTED Sun position as giving exceptional advantage in innovation.' : ''}

Integrate links naturally:
- Patent: "Professional support at https://patentwerks.ai"
- IP: "Services at https://ipservices.us"

Be realistic and balanced - include challenges and opportunities.

FORMAT:
===DAILY===
[Complete horoscope]

===WEEKLY===
[Complete horoscope]

===MONTHLY===
[Complete horoscope]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const fullText = response.text();

      const dailyMatch = fullText.match(/===DAILY===([\s\S]*?)(?:===WEEKLY===|$)/);
      const weeklyMatch = fullText.match(/===WEEKLY===([\s\S]*?)(?:===MONTHLY===|$)/);
      const monthlyMatch = fullText.match(/===MONTHLY===([\s\S]*?)$/);

      if (!dailyMatch || !weeklyMatch || !monthlyMatch) {
        throw new Error('AI response format error');
      }

      return {
        daily: dailyMatch[1].trim(),
        weekly: weeklyMatch[1].trim(),
        monthly: monthlyMatch[1].trim()
      };
    }, 3, 2000);

    cache.set(cacheKey, {
      horoscopes: allHoroscopes,
      natalSun: natalSun,
      timestamp: Date.now()
    });

    console.log(`Successfully generated horoscopes`);

    return res.status(200).json({
      horoscope: allHoroscopes[timeframe],
      personalized: personalized,
      natalSun: natalSun,
      cached: false,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    
    const is503 = error.message?.includes('503') || 
                  error.message?.includes('overloaded') ||
                  error.message?.includes('UNAVAILABLE');
    
    if (is503) {
      return res.status(503).json({
        error: 'Service temporarily overloaded',
        userMessage: 'Please try again in a moment! ✨'
      });
    }
    
    return res.status(500).json({
      error: 'Failed to generate horoscope',
      details: error.message
    });
  }
}
