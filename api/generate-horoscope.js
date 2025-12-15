// api/generate-horoscope-FIXED-CACHE.js
// Fixed caching logic - each timeframe has appropriate duration

import { GoogleGenerativeAI } from '@google/generative-ai';

const cache = new Map();

// Get the appropriate date key based on timeframe
function getTimeframeDate(timeframe) {
  const now = new Date();
  
  switch(timeframe) {
    case 'daily':
      // Cache daily horoscopes per day
      return now.toISOString().split('T')[0]; // YYYY-MM-DD
      
    case 'weekly':
      // Cache weekly horoscopes per week (Monday-Sunday)
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); // Get last Monday
      return `week-${monday.toISOString().split('T')[0]}`; // week-YYYY-MM-DD
      
    case 'monthly':
      // Cache monthly horoscopes per month
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      
    default:
      return now.toISOString().split('T')[0];
  }
}

// Generate cache key with timeframe-appropriate dating
function getCacheKey(signName, birthDate, timeframe) {
  const birthKey = birthDate ? `-${birthDate}` : '';
  const dateKey = getTimeframeDate(timeframe);
  return `${signName}${birthKey}-${timeframe}-${dateKey}`;
}

// Check if cache entry is still valid for its timeframe
function isCacheValid(cacheEntry, timeframe) {
  if (!cacheEntry) return false;
  
  const now = Date.now();
  const age = now - cacheEntry.timestamp;
  
  // Set expiration based on timeframe
  let maxAge;
  switch(timeframe) {
    case 'daily':
      maxAge = 24 * 60 * 60 * 1000; // 24 hours
      break;
    case 'weekly':
      maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      break;
    case 'monthly':
      maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      break;
    default:
      maxAge = 24 * 60 * 60 * 1000;
  }
  
  return age < maxAge;
}

// Simplified: Calculate approximate Sun sign and degree from birth date
function calculateNatalSunSimplified(birthDate) {
  // Parse date string directly to avoid timezone issues
  const parts = birthDate.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]); // 1-12
  const day = parseInt(parts[2]);
  
  // Zodiac sign date ranges
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
        const daysInFirstMonth = (range.start.month === month ? 0 : 30 - range.start.day);
        dayOfSign = daysInFirstMonth + day;
      }
      
      const degree = Math.min(29, dayOfSign);
      
      return {
        sign: range.sign,
        degree: degree.toFixed(1),
        exactPosition: `${range.sign} ${degree.toFixed(1)}°`
      };
    }
  }
  
  return {
    sign: 'Aries',
    degree: '0.0',
    exactPosition: 'Aries 0.0°'
  };
}

function generatePersonalizedContext(natalSun, currentDate) {
  return `
Your natal Sun is in ${natalSun.exactPosition}. This is YOUR personal cosmic signature.

PERSONALIZATION NOTE:
This horoscope is personalized to your birth chart. Current planetary transits 
are affecting YOUR natal Sun position specifically.`;
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

    // Check cache with timeframe-specific key
    const cacheKey = getCacheKey(sign.name, birthDate, timeframe);
    const cachedEntry = cache.get(cacheKey);

    if (isCacheValid(cachedEntry, timeframe)) {
      console.log(`Cache HIT for ${sign.name} ${timeframe} (${birthDate ? 'personalized' : 'generic'})`);
      return res.status(200).json({
        horoscope: cachedEntry.horoscope,
        personalized: !!birthDate,
        natalSun: cachedEntry.natalSun,
        cached: true,
        cacheKey: cacheKey, // For debugging
        generatedAt: new Date(cachedEntry.timestamp).toISOString()
      });
    }

    console.log(`Cache MISS for ${sign.name} ${timeframe} - generating ${birthDate ? 'PERSONALIZED' : 'generic'}`);

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

    // Generate horoscope for THIS specific timeframe
    const horoscope = await retryWithBackoff(async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.9,
        }
      });

      const currentDate = new Date();
      let dateContext = '';
      
      if (timeframe === 'daily') {
        dateContext = currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
      } else if (timeframe === 'weekly') {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        dateContext = `Week of ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`;
      } else {
        dateContext = currentDate.toLocaleDateString('en-US', { 
          month: 'long', year: 'numeric' 
        });
      }

      const prompt = `Generate a ${timeframe} horoscope for ${sign.name}.

DATE: ${dateContext}

${personalized ? personalizationContext : ''}

This horoscope is for INVENTORS and ENTREPRENEURS.

${personalized ? `IMPORTANT: This is PERSONALIZED to someone with natal Sun at ${natalSun.exactPosition}. Reference their specific degree and birth position.` : ''}

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
Each section needs 2-3 full paragraphs.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }, 3, 2000);

    // Cache THIS specific timeframe's horoscope
    cache.set(cacheKey, {
      horoscope: horoscope,
      natalSun: natalSun,
      timestamp: Date.now()
    });

    console.log(`Generated ${personalized ? 'PERSONALIZED' : 'generic'} ${timeframe} horoscope`);
    console.log(`Cache key: ${cacheKey}`);

    return res.status(200).json({
      horoscope: horoscope,
      personalized: personalized,
      natalSun: natalSun,
      cached: false,
      cacheKey: cacheKey, // For debugging
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
