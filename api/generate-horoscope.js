// api/generate-horoscope-BALANCED.js
// Properly balances astrology + biorhythm

import { GoogleGenerativeAI } from '@google/generative-ai';

const cache = new Map();

function getTimeframeDate(timeframe) {
  const now = new Date();
  switch(timeframe) {
    case 'daily':
      return now.toISOString().split('T')[0];
    case 'weekly':
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      return `week-${monday.toISOString().split('T')[0]}`;
    case 'monthly':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    default:
      return now.toISOString().split('T')[0];
  }
}

function getCacheKey(signName, birthDate, timeframe) {
  const birthKey = birthDate ? `-${birthDate}` : '';
  const dateKey = getTimeframeDate(timeframe);
  return `${signName}${birthKey}-${timeframe}-${dateKey}`;
}

function isCacheValid(cacheEntry, timeframe) {
  if (!cacheEntry) return false;
  const now = Date.now();
  const age = now - cacheEntry.timestamp;
  let maxAge;
  switch(timeframe) {
    case 'daily': maxAge = 24 * 60 * 60 * 1000; break;
    case 'weekly': maxAge = 7 * 24 * 60 * 60 * 1000; break;
    case 'monthly': maxAge = 30 * 24 * 60 * 60 * 1000; break;
    default: maxAge = 24 * 60 * 60 * 1000;
  }
  return age < maxAge;
}

function calculateNatalSunSimplified(birthDate) {
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
      return {
        sign: range.sign,
        degree: degree.toFixed(1),
        exactPosition: `${range.sign} ${degree.toFixed(1)}°`
      };
    }
  }
  
  return { sign: 'Aries', degree: '0.0', exactPosition: 'Aries 0.0°' };
}

// Generate BALANCED astrology + biorhythm context
function generatePersonalizedContext(natalSun, biorhythm) {
  let context = `
═══════════════════════════════════════════════
YOUR PERSONALIZED ASTROLOGICAL PROFILE
═══════════════════════════════════════════════

NATAL CHART:
Your natal Sun is in ${natalSun.exactPosition}
This is YOUR personal cosmic signature and the foundation for all transits.

ASTROLOGICAL INSTRUCTIONS:
1. Primary predictions should be based on CURRENT PLANETARY TRANSITS to this natal Sun position
2. Reference specific transits (e.g., "Saturn square your natal Sun at ${natalSun.exactPosition}")
3. Explain what each transit MEANS for inventors/entrepreneurs
4. Provide astrological timing (when transits are exact)
`;

  if (biorhythm) {
    const getPhase = (value) => {
      if (value > 50) return 'High';
      if (value > 0) return 'Rising';
      if (value > -50) return 'Declining';
      return 'Low';
    };
    
    context += `
═══════════════════════════════════════════════
YOUR CURRENT BIORHYTHM CYCLES
═══════════════════════════════════════════════

Physical Cycle: ${biorhythm.physical}% (${getPhase(biorhythm.physical)} Phase)
Emotional Cycle: ${biorhythm.emotional}% (${getPhase(biorhythm.emotional)} Phase)
Intellectual Cycle: ${biorhythm.intellectual}% (${getPhase(biorhythm.intellectual)} Phase)

BIORHYTHM INSTRUCTIONS:
1. Use biorhythm for TIMING advice within the astrological predictions
2. Example: "Saturn delays patent approvals (astrology), but your intellectual 
   peak Thursday (biorhythm) is ideal for documentation work"
3. Biorhythm provides the WHEN, astrology provides the WHAT/WHY
4. Connect biorhythm phases to specific activities:
   - Physical → prototyping, workshops, physical meetings
   - Emotional → pitching, networking, partnerships
   - Intellectual → patent writing, R&D, problem-solving
`;
  }

  context += `
═══════════════════════════════════════════════
INTEGRATION FRAMEWORK
═══════════════════════════════════════════════

For each section, structure your response as:

1. ASTROLOGICAL INFLUENCE (primary):
   "Saturn square your natal Sun creates delays in authority matters..."
   
2. BIORHYTHM TIMING (secondary):
   "Your intellectual cycle peaks Wednesday (88%), making it the ideal 
   day to finalize documentation despite Saturn's pressure..."
   
3. PRACTICAL ADVICE:
   "Focus on perfecting your patent claims Wednesday when mental 
   clarity is highest, accepting that approval timing is beyond 
   your control due to Saturn's influence."

BALANCE: 70% astrology (the cosmic forces), 30% biorhythm (the timing)
`;

  return context;
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
    const { sign, timeframe = 'daily', birthDate = null, biorhythm = null } = req.body;

    if (!sign || !sign.name) {
      return res.status(400).json({ error: 'Sign information is required' });
    }

    const cacheKey = getCacheKey(sign.name, birthDate, timeframe);
    const cachedEntry = cache.get(cacheKey);

    if (isCacheValid(cachedEntry, timeframe)) {
      console.log(`Cache HIT for ${sign.name} ${timeframe}`);
      return res.status(200).json({
        horoscope: cachedEntry.horoscope,
        personalized: !!birthDate,
        natalSun: cachedEntry.natalSun,
        cached: true,
        cacheKey: cacheKey,
        generatedAt: new Date(cachedEntry.timestamp).toISOString()
      });
    }

    console.log(`Cache MISS - generating ${birthDate ? 'PERSONALIZED' : 'generic'}`);

    let natalSun = null;
    let personalizationContext = '';
    let personalized = false;
    
    if (birthDate) {
      try {
        natalSun = calculateNatalSunSimplified(birthDate);
        personalizationContext = generatePersonalizedContext(natalSun, biorhythm);
        personalized = true;
        console.log(`Natal Sun: ${natalSun.exactPosition}`);
        if (biorhythm) {
          console.log(`Biorhythm: P${biorhythm.physical}% E${biorhythm.emotional}% I${biorhythm.intellectual}%`);
        }
      } catch (error) {
        console.warn('Personalization failed:', error);
      }
    }

    const horoscopeText = await retryWithBackoff(async () => {
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

${personalized && natalSun ? `
═══════════════════════════════════════════════
CRITICAL PERSONALIZATION REQUIREMENTS
═══════════════════════════════════════════════

This is PERSONALIZED to someone with natal Sun at ${natalSun.exactPosition}.

PRIMARY FOCUS (70%): ASTROLOGICAL TRANSITS
- Reference current planetary transits to their natal Sun
- Explain what each transit means for innovation/business
- Provide specific dates when transits are exact
- Use traditional astrological language and concepts

SECONDARY FOCUS (30%): BIORHYTHM TIMING
${biorhythm ? `- Use biorhythm cycles for specific day-to-day timing
- Physical ${biorhythm.physical}%: When to do hands-on work
- Emotional ${biorhythm.emotional}%: When to pitch/network
- Intellectual ${biorhythm.intellectual}%: When to do technical work` : ''}

EXAMPLE INTEGRATION:
"Jupiter's trine to your natal Sun at ${natalSun.exactPosition} brings 
expansion opportunities in funding this week. This beneficial transit 
peaks December 18th. ${biorhythm ? `Your emotional cycle is also high 
(${biorhythm.emotional}%), making Tuesday-Wednesday ideal for investor 
pitches when both cosmic and personal energies align.` : ''}"
` : ''}

Include sections:
**Innovation & Product Development**
${personalized ? '(Lead with planetary transits, add biorhythm timing)' : ''}

**Patent & IP Protection**
${personalized ? '(Astrological influences on documentation, biorhythm for best work days)' : ''}

**Commercialization & Funding**
${personalized ? '(Transit impacts on resources, biorhythm for networking timing)' : ''}

**Strategic Planning**
${personalized ? '(Long-term astrological trends, biorhythm for execution timing)' : ''}

**Inventor's Personal Growth**
${personalized ? '(Spiritual/growth transits, emotional/intellectual cycles)' : ''}

Integrate links naturally:
- Patent: "Professional support at https://patentwerks.ai"
- IP: "Services at https://ipservices.us"

Be realistic and balanced - include challenges and opportunities.
Each section needs 2-3 full paragraphs.

REMEMBER: Astrology is primary (the WHAT and WHY), biorhythm is secondary (the WHEN and HOW).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }, 3, 2000);

    cache.set(cacheKey, {
      horoscope: horoscopeText,
      natalSun: natalSun,
      timestamp: Date.now()
    });

    return res.status(200).json({
      horoscope: horoscopeText,
      personalized: personalized,
      natalSun: natalSun,
      cached: false,
      cacheKey: cacheKey,
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
