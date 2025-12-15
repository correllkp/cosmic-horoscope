// api/generate-horoscope-personalized.js
// Uses birth date for REAL personalized astrology with transits

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as astronomy from 'astronomy-engine';

const cache = new Map();

function getCacheKey(signName, birthDate, date) {
  // Include birthDate in cache key for personalization
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

// Get zodiac sign from longitude
function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const index = Math.floor(longitude / 30);
  return signs[index];
}

// Calculate natal Sun position from birth date
function calculateNatalSun(birthDate) {
  const date = new Date(birthDate);
  const equator = astronomy.Equator('Sun', date, null, false, true);
  const ecliptic = astronomy.Ecliptic(equator);
  
  const zodiacDegree = ecliptic.elon;
  const sign = getZodiacSign(zodiacDegree);
  const degree = zodiacDegree % 30;
  
  return {
    sign: sign,
    degree: degree.toFixed(1),
    longitude: zodiacDegree.toFixed(1),
    exactPosition: `${sign} ${degree.toFixed(1)}°`
  };
}

// Get current planetary positions
function getPlanetaryPositions(date) {
  const bodies = [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 
    'Jupiter', 'Saturn'
  ];
  
  const positions = {};
  
  for (const body of bodies) {
    const equator = astronomy.Equator(body, date, null, false, true);
    const ecliptic = astronomy.Ecliptic(equator);
    
    const zodiacDegree = ecliptic.elon;
    const sign = getZodiacSign(zodiacDegree);
    const degree = zodiacDegree % 30;
    
    positions[body] = {
      sign: sign,
      degree: degree.toFixed(1),
      longitude: zodiacDegree.toFixed(1),
      exactPosition: `${sign} ${degree.toFixed(1)}°`
    };
  }
  
  return positions;
}

// Calculate transits to natal Sun
function calculateTransits(natalSun, currentPositions) {
  const transits = [];
  const natalLong = parseFloat(natalSun.longitude);
  
  // Check each current planet's relationship to natal Sun
  for (const [planet, position] of Object.entries(currentPositions)) {
    if (planet === 'Sun') continue; // Skip Sun-Sun comparison
    
    const currentLong = parseFloat(position.longitude);
    let diff = Math.abs(currentLong - natalLong);
    if (diff > 180) diff = 360 - diff;
    
    // Check for major aspects
    const aspects = [
      { name: 'conjunction', angle: 0, orb: 8, quality: 'intense' },
      { name: 'sextile', angle: 60, orb: 6, quality: 'opportunity' },
      { name: 'square', angle: 90, orb: 8, quality: 'challenge' },
      { name: 'trine', angle: 120, orb: 8, quality: 'harmony' },
      { name: 'opposition', angle: 180, orb: 8, quality: 'tension' }
    ];
    
    for (const aspect of aspects) {
      if (Math.abs(diff - aspect.angle) <= aspect.orb) {
        const interpretation = getTransitInterpretation(
          planet, 
          aspect.name, 
          natalSun.sign
        );
        
        transits.push({
          planet: planet,
          aspect: aspect.name,
          quality: aspect.quality,
          orb: Math.abs(diff - aspect.angle).toFixed(1),
          interpretation: interpretation,
          description: `${planet} ${aspect.name} your natal Sun (${natalSun.exactPosition})`
        });
      }
    }
  }
  
  return transits;
}

// Interpret what a transit means for inventors
function getTransitInterpretation(planet, aspect, natalSign) {
  const transitMeanings = {
    'Saturn': {
      conjunction: 'Major restructuring of innovation strategy - serious focus required',
      square: 'Patent delays and bureaucratic obstacles - patience essential',
      opposition: 'External authorities challenge your IP plans - document thoroughly',
      trine: 'Structured approach to patent strategy pays off - file now',
      sextile: 'Opportunities for disciplined IP development'
    },
    'Jupiter': {
      conjunction: 'Major expansion in funding and partnerships - think big',
      square: 'Over-optimism in projections - stay realistic on timelines',
      opposition: 'Balance growth ambitions with practical limitations',
      trine: 'Excellent for investor pitches and securing funding - golden period',
      sextile: 'Good opportunities for strategic partnerships'
    },
    'Mars': {
      conjunction: 'Surge of innovative energy - act boldly but not impulsively',
      square: 'Conflicts with collaborators - manage ego carefully',
      opposition: 'Competition intensifies - defend your IP aggressively',
      trine: 'Excellent momentum for pushing projects forward rapidly',
      sextile: 'Good energy for tackling R&D challenges'
    },
    'Venus': {
      conjunction: 'Harmonious partnerships and investor relations',
      square: 'Creative differences with partners - compromise needed',
      opposition: 'Balance innovation with market appeal',
      trine: 'Smooth negotiations and collaborative success',
      sextile: 'Pleasant networking opportunities'
    },
    'Mercury': {
      conjunction: 'Mental clarity on patent strategy and documentation',
      square: 'Communication mix-ups in IP discussions - clarify details',
      opposition: 'Competing viewpoints on technical approach',
      trine: 'Clear thinking and effective technical communication',
      sextile: 'Good for writing patent specifications'
    }
  };
  
  return transitMeanings[planet]?.[aspect] || 
    `${planet} ${aspect} your natal Sun creates ${aspect} energy`;
}

// Calculate general planetary aspects (non-personalized)
function calculateGeneralAspects(positions) {
  const aspects = [];
  const bodies = Object.keys(positions);
  
  const aspectTypes = {
    conjunction: { angle: 0, orb: 8 },
    sextile: { angle: 60, orb: 6 },
    square: { angle: 90, orb: 8 },
    trine: { angle: 120, orb: 8 },
    opposition: { angle: 180, orb: 8 }
  };
  
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const body1 = bodies[i];
      const body2 = bodies[j];
      const long1 = parseFloat(positions[body1].longitude);
      const long2 = parseFloat(positions[body2].longitude);
      
      let diff = Math.abs(long1 - long2);
      if (diff > 180) diff = 360 - diff;
      
      for (const [aspectName, aspectData] of Object.entries(aspectTypes)) {
        if (Math.abs(diff - aspectData.angle) <= aspectData.orb) {
          aspects.push({
            planet1: body1,
            planet2: body2,
            type: aspectName,
            description: `${body1} ${aspectName} ${body2}`
          });
        }
      }
    }
  }
  
  return aspects;
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
        console.log(`Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
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

    // Check cache (personalized if birthDate provided)
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = getCacheKey(sign.name, birthDate, today);
    const cachedEntry = cache.get(cacheKey);

    if (isCacheValid(cachedEntry)) {
      console.log(`Cache HIT for ${sign.name} (${birthDate ? 'personalized' : 'generic'}) - returning ${timeframe}`);
      return res.status(200).json({
        horoscope: cachedEntry.horoscopes[timeframe],
        personalized: !!birthDate,
        natalSun: cachedEntry.natalSun,
        transits: cachedEntry.transits,
        cached: true,
        generatedAt: new Date(cachedEntry.timestamp).toISOString()
      });
    }

    console.log(`Cache MISS for ${sign.name} - calculating ${birthDate ? 'PERSONALIZED' : 'generic'} astrology`);

    // Get current planetary positions
    const currentDate = new Date();
    const currentPositions = getPlanetaryPositions(currentDate);
    
    // Calculate natal Sun and transits if birth date provided
    let natalSun = null;
    let transits = [];
    let personalized = false;
    
    if (birthDate) {
      try {
        natalSun = calculateNatalSun(birthDate);
        transits = calculateTransits(natalSun, currentPositions);
        personalized = true;
        console.log(`Personalized: Natal Sun at ${natalSun.exactPosition}`);
        console.log(`Active transits: ${transits.length}`);
      } catch (error) {
        console.warn('Birth date calculation failed, using generic predictions:', error);
      }
    }
    
    // Calculate general aspects (for context)
    const generalAspects = calculateGeneralAspects(currentPositions);

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

      // Format planetary data
      const planetaryData = Object.entries(currentPositions)
        .map(([planet, data]) => `${planet}: ${data.exactPosition}`)
        .join('\n');

      const aspectData = generalAspects
        .map(a => a.description)
        .join('\n');

      const dateStr = currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const monthName = currentDate.toLocaleDateString('en-US', { 
        month: 'long', year: 'numeric' 
      });

      // Build personalization section
      let personalizationSection = '';
      if (personalized && transits.length > 0) {
        personalizationSection = `
===PERSONALIZED TRANSIT ANALYSIS===
Your natal Sun is at ${natalSun.exactPosition}

ACTIVE TRANSITS TO YOUR NATAL SUN:
${transits.map(t => `${t.description} - ${t.interpretation}`).join('\n')}

CRITICAL: These transits are SPECIFIC TO THIS PERSON's birth chart. Reference these personal transits throughout all three horoscopes. Make predictions based on THEIR natal Sun position, not generic ${sign.name} predictions.

For example:
- If Saturn is squaring their natal Sun: "Saturn's square to your natal Sun at ${natalSun.degree}° requires patience with patent delays"
- If Jupiter is trine their natal Sun: "Jupiter's trine to your natal Sun at ${natalSun.degree}° brings exceptional funding opportunities"

This is REAL personalized astrology - not generic zodiac predictions.`;
      }

      const prompt = `Generate THREE integrated horoscopes for ${sign.name} using REAL ASTRONOMICAL DATA.

TODAY'S DATE: ${dateStr}
THIS WEEK: ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}
THIS MONTH: ${monthName}

===REAL PLANETARY POSITIONS TODAY===
${planetaryData}

===GENERAL PLANETARY ASPECTS TODAY===
${aspectData}
${personalizationSection}

These horoscopes are for INVENTORS and ENTREPRENEURS.

${personalized ? 'IMPORTANT: This is a PERSONALIZED horoscope. Reference the specific transits to their natal Sun throughout. Make timing predictions based on when these transits are exact.' : 'This is a generic horoscope based on zodiac sign only.'}

Include sections:
**Innovation & Product Development**
**Patent & IP Protection**
**Commercialization & Funding**
**Strategic Planning**
**Inventor's Personal Growth**

Integrate these links naturally:
- Patent strategy: "Professional support at https://patentwerks.ai"
- IP services: "Comprehensive services at https://ipservices.us"

FORMAT:
===DAILY===
[Complete horoscope ${personalized ? 'referencing personal transits' : 'using general astronomy'}]

===WEEKLY===
[Complete horoscope showing weekly planetary movements]

===MONTHLY===
[Complete horoscope showing monthly themes]

Make predictions SPECIFIC, based on REAL astronomy${personalized ? ' and PERSONAL transits' : ''}.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const fullText = response.text();

      // Parse horoscopes
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
      transits: transits,
      planetaryData: { currentPositions, generalAspects },
      timestamp: Date.now()
    });

    console.log(`Successfully generated ${personalized ? 'PERSONALIZED' : 'generic'} horoscopes`);

    return res.status(200).json({
      horoscope: allHoroscopes[timeframe],
      personalized: personalized,
      natalSun: natalSun,
      transits: transits,
      planetaryData: { currentPositions, generalAspects },
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
