// api/generate-horoscope-WITH-BIORHYTHM.js
// Updated API that incorporates biorhythm into predictions

import { GoogleGenerativeAI } from '@google/generative-ai';

const cache = new Map();

// Get the appropriate date key based on timeframe
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

// Generate cache key with timeframe-appropriate dating
function getCacheKey(signName, birthDate, timeframe) {
  const birthKey = birthDate ? `-${birthDate}` : '';
  const dateKey = getTimeframeDate(timeframe);
  return `${signName}${birthKey}-${timeframe}-${dateKey}`;
}

// Check if cache entry is still valid
function isCacheValid(cacheEntry, timeframe) {
  if (!cacheEntry) return false;
  
  const now = Date.now();
  const age = now - cacheEntry.timestamp;
  
  let maxAge;
  switch(timeframe) {
    case 'daily':
      maxAge = 24 * 60 * 60 * 1000;
      break;
    case 'weekly':
      maxAge = 7 * 24 * 60 * 60 * 1000;
      break;
    case 'monthly':
      maxAge = 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      maxAge = 24 * 60 * 60 * 1000;
  }
  
  return age < maxAge;
}

// Calculate natal Sun position
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

// Generate biorhythm context for AI
function generateBiorhythmContext(biorhythm) {
  if (!biorhythm) return '';
  
  const { physical, emotional, intellectual } = biorhythm;
  
  // Determine phase descriptions
  const getPhase = (value) => {
    if (value > 50) return 'High';
    if (value > 0) return 'Rising';
    if (value > -50) return 'Declining';
    return 'Low';
  };
  
  const physicalPhase = getPhase(physical);
  const emotionalPhase = getPhase(emotional);
  const intellectualPhase = getPhase(intellectual);
  
  // Generate detailed context
  return `
CURRENT BIORHYTHM CYCLES:

Physical Cycle: ${physical.toFixed(1)}% (${physicalPhase} Phase)
${physical > 50 ? '- Peak physical energy and stamina' : 
  physical > 0 ? '- Building physical energy' :
  physical > -50 ? '- Declining physical energy, time for rest' :
  '- Low physical energy, focus on recovery'}
  
Emotional Cycle: ${emotional.toFixed(1)}% (${emotionalPhase} Phase)
${emotional > 50 ? '- Peak emotional sensitivity and creativity' :
  emotional > 0 ? '- Growing emotional awareness' :
  emotional > -50 ? '- Declining emotional energy, introspection time' :
  '- Low emotional energy, process and reflect'}

Intellectual Cycle: ${intellectual.toFixed(1)}% (${intellectualPhase} Phase)
${intellectual > 50 ? '- Peak mental clarity and problem-solving ability' :
  intellectual > 0 ? '- Rising cognitive power' :
  intellectual > -50 ? '- Declining mental energy, review rather than start new' :
  '- Low mental energy, focus on routine tasks'}

INTEGRATION INSTRUCTIONS:
- Reference these specific biorhythm phases in your predictions
- For high physical: Emphasize hands-on work, prototyping, physical meetings
- For low physical: Suggest planning, strategy, delegation
- For high emotional: Great for creativity, partnerships, investor pitches
- For low emotional: Focus on analytical work, avoid emotional decisions
- For high intellectual: Perfect for patent writing, technical documentation, problem-solving
- For low intellectual: Review existing work, handle routine tasks

Connect biorhythm to specific inventor activities:
- Physical → Prototyping, lab work, workshops, trade shows
- Emotional → Networking, partnerships, team building, pitching
- Intellectual → Patent applications, technical writing, R&D, problem-solving`;
}

function generatePersonalizedContext(natalSun, biorhythm) {
  let context = `
Your natal Sun is in ${natalSun.exactPosition}. This is YOUR personal cosmic signature.`;

  if (biorhythm) {
    context += generateBiorhythmContext(biorhythm);
  }

  return context + `

PERSONALIZATION NOTE:
This horoscope is personalized to your birth chart AND your current biorhythm cycles. 
Integrate both the astrological transits and biorhythm phases into your predictions.`;
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

    // Check cache
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

    console.log(`Cache MISS - generating ${birthDate ? 'PERSONALIZED' : 'generic'} ${timeframe}`);
    if (biorhythm) {
      console.log(`Biorhythm: Physical ${biorhythm.physical}%, Emotional ${biorhythm.emotional}%, Intellectual ${biorhythm.intellectual}%`);
    }

    // Calculate natal Sun if birth date provided
    let natalSun = null;
    let personalizationContext = '';
    let personalized = false;
    
    if (birthDate) {
      try {
        natalSun = calculateNatalSunSimplified(birthDate);
        personalizationContext = generatePersonalizedContext(natalSun, biorhythm);
        personalized = true;
        console.log(`Natal Sun: ${natalSun.exactPosition}`);
      } catch (error) {
        console.warn('Birth date calculation failed:', error);
      }
    }

    // Generate horoscope
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

${personalized && natalSun ? `CRITICAL: This is PERSONALIZED to someone with natal Sun at ${natalSun.exactPosition}. Reference their specific degree and birth position.` : ''}

${biorhythm ? `CRITICAL: Incorporate their CURRENT BIORHYTHM phases into predictions. Reference specific cycles and how they affect innovation activities.` : ''}

Include sections:
**Innovation & Product Development**
${biorhythm ? '(Reference physical and intellectual cycles)' : ''}

**Patent & IP Protection**
${biorhythm ? '(Reference intellectual cycle for documentation)' : ''}

**Commercialization & Funding**
${biorhythm ? '(Reference emotional cycle for pitching/networking)' : ''}

**Strategic Planning**
${biorhythm ? '(Integrate all three cycles for timing advice)' : ''}

**Inventor's Personal Growth**
${biorhythm ? '(Reference emotional and intellectual cycles)' : ''}

Integrate links naturally:
- Patent: "Professional support at https://patentwerks.ai"
- IP: "Services at https://ipservices.us"

Be realistic and balanced - include challenges and opportunities.
Each section needs 2-3 full paragraphs.

${biorhythm ? `
BIORHYTHM INTEGRATION EXAMPLES:
- "With your intellectual cycle at its peak (${biorhythm.intellectual}%), this is the ideal time for patent documentation..."
- "Your physical cycle is in a declining phase (${biorhythm.physical}%), suggesting delegation of hands-on work..."
- "High emotional energy (${biorhythm.emotional}%) supports successful investor pitches and partnership negotiations..."
` : ''}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }, 3, 2000);

    // Cache the result
    cache.set(cacheKey, {
      horoscope: horoscopeText,
      natalSun: natalSun,
      timestamp: Date.now()
    });

    console.log(`Generated ${personalized ? 'PERSONALIZED' : 'generic'} horoscope with ${biorhythm ? 'BIORHYTHM' : 'no biorhythm'}`);

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
