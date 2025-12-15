// api/generate-horoscope-simple-personalized.js
// Personalized astrology WITHOUT astronomy-engine library
// Uses simplified date-based Sun position calculation

import { GoogleGenerativeAI } from '@google/generative-ai';

const cache = new Map();

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

// Simplified: Calculate approximate Sun sign and degree from birth date
function calculateNatalSunSimplified(birthDate) {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // Zodiac sign date ranges with approximate degrees
  const zodiacRanges = [
    { sign: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 }, startDegree: 0 },
    { sign: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 }, startDegree: 0 },
    { sign: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 }, startDegree: 0 },
    { sign: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 }, startDegree: 0 },
    { sign: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 }, startDegree: 0 },
    { sign: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 }, startDegree: 0 },
    { sign: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 }, startDegree: 0 },
    { sign: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 }, startDegree: 0 },
    { sign: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 }, startDegree: 0 },
    { sign: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 }, startDegree: 0 },
    { sign: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 }, startDegree: 0 },
    { sign: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 }, startDegree: 0 },
  ];
  
  // Find which sign the birth date falls into
  for (const range of zodiacRanges) {
    const inRange = 
      (month === range.start.month && day >= range.start.day) ||
      (month === range.end.month && day <= range.end.day) ||
      (range.start.month < range.end.month && month > range.start.month && month < range.end.month);
    
    if (inRange) {
      // Approximate degree within sign (0-30)
      // Calculate day of sign
      let dayOfSign;
      if (month === range.start.month) {
        dayOfSign = day - range.start.day + 1;
      } else {
        // Approximate days in first month + days in current month
        const daysInFirstMonth = (range.start.month === month ? 0 : 30 - range.start.day);
        dayOfSign = daysInFirstMonth + day;
      }
      
      // Approximate degree (assuming 30 days per sign)
      const degree = Math.min(29, dayOfSign);
      
      return {
        sign: range.sign,
        degree: degree.toFixed(1),
        exactPosition: `${range.sign} ${degree.toFixed(1)}°`
      };
    }
  }
  
  // Fallback
  return {
    sign: 'Aries',
    degree: '0.0',
    exactPosition: 'Aries 0.0°'
  };
}

// Generate personalized context without complex astronomy calculations
function generatePersonalizedContext(natalSun, currentDate) {
  // Simple: Generate context about their natal Sun position
  return `
Your natal Sun is in ${natalSun.exactPosition}. This is YOUR personal cosmic signature.

PERSONALIZATION NOTE:
This horoscope is personalized to your birth chart. Current planetary transits 
are affecting YOUR natal Sun position specifically. The predictions below are 
based on how today's cosmic energies interact with YOUR ${natalSun.sign} Sun.

For example, if you were born early in ${natalSun.sign} (${natalSun.degree}°), 
current planetary movements will affect you differently than someone born later 
in the sign.`;
}

// Helper functions
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

    // Check cache
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

    console.log(`Cache MISS - generating ${birthDate ? 'PERSONALIZED' : 'generic'} horoscope`);

    // Calculate natal Sun if birth date provided
    let natalSun = null;
    let personalizationContext = '';
    let personalized = false;
    
    if (birthDate) {
      try {
        natalSun = calculateNatalSunSimplified(birthDate);
        personalizationContext = generatePersonalizedContext(natalSun, new Date());
        personalized = true;
        console.log(`Personalized: Natal Sun at ${natalSun.exactPosition}`);
      } catch (error) {
        console.warn('Birth date calculation failed:', error);
      }
    }

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

      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const monthName = currentDate.toLocaleDateString('en-US', { 
        month: 'long', year: 'numeric' 
      });

      const prompt = `Generate THREE integrated horoscopes for ${sign.name}.

TODAY'S DATE: ${dateStr}
THIS WEEK: ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}
THIS MONTH: ${monthName}

${personalized ? personalizationContext : ''}

These horoscopes are for INVENTORS and ENTREPRENEURS.

${personalized ? `
CRITICAL: This is PERSONALIZED to someone born with their Sun at ${natalSun.exactPosition}.
Reference their specific degree and birth position throughout. Make predictions that 
acknowledge this is THEIR personal chart, not a generic ${sign.name} prediction.
` : ''}

Include sections:
**Innovation & Product Development**
**Patent & IP Protection**
**Commercialization & Funding**
**Strategic Planning**
**Inventor's Personal Growth**

Integrate links naturally:
- Patent: "Professional support at https://patentwerks.ai"
- IP: "Services at https://ipservices.us"

Be realistic and balanced - include challenges and opportunities.
Each section needs 2-3 full paragraphs.

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

    // Cache the result
    cache.set(cacheKey, {
      horoscopes: allHoroscopes,
      natalSun: natalSun,
      timestamp: Date.now()
    });

    console.log(`Generated ${personalized ? 'PERSONALIZED' : 'generic'} horoscopes`);

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
