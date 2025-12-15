// api/generate-horoscope.js
// With automatic retry logic for 503 errors

import { GoogleGenerativeAI } from '@google/generative-ai';

// In-memory cache
const cache = new Map();

function getCacheKey(signName, timeframe, date) {
  return `${signName}-${timeframe}-${date}`;
}

function isCacheValid(cacheEntry, timeframe) {
  if (!cacheEntry) return false;
  
  const now = Date.now();
  const age = now - cacheEntry.timestamp;
  
  const CACHE_DURATION = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000
  };
  
  return age < CACHE_DURATION[timeframe];
}

// Helper: Wait for specified milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Retry with exponential backoff for 503 errors
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 2000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a 503 (overloaded) error
      const is503 = error.message?.includes('503') || 
                    error.message?.includes('overloaded') ||
                    error.message?.includes('UNAVAILABLE');
      
      if (is503 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Gemini API overloaded (503), retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      
      // If not 503 or final retry, throw the error
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
    const { sign, timeframe = 'daily' } = req.body;

    if (!sign || !sign.name) {
      return res.status(400).json({ error: 'Sign information is required' });
    }

    // Check cache
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = getCacheKey(sign.name, timeframe, today);
    const cachedEntry = cache.get(cacheKey);

    if (isCacheValid(cachedEntry, timeframe)) {
      console.log(`Cache HIT for ${sign.name} ${timeframe}`);
      return res.status(200).json({
        horoscope: cachedEntry.horoscope,
        cached: true,
        generatedAt: new Date(cachedEntry.timestamp).toISOString()
      });
    }

    console.log(`Cache MISS for ${sign.name} ${timeframe} - generating new`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      throw new Error('API key not configured');
    }

    // Generate horoscope with retry logic
    const horoscopeText = await retryWithBackoff(async () => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.9,
        }
      });

      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      let timeframePrompt = '';
      let timeframeContext = '';

      if (timeframe === 'daily') {
        timeframeContext = `Today is ${dateStr}.`;
        timeframePrompt = `Generate a daily horoscope for ${sign.name} for today (${dateStr}).`;
      } else if (timeframe === 'weekly') {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        timeframeContext = `This week runs from ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}.`;
        timeframePrompt = `Generate a weekly horoscope for ${sign.name} for this week.`;
      } else if (timeframe === 'monthly') {
        const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        timeframeContext = `This month is ${monthName}.`;
        timeframePrompt = `Generate a monthly horoscope for ${sign.name} for ${monthName}.`;
      }

      const prompt = `${timeframePrompt}

${timeframeContext}

This horoscope is specifically for INVENTORS and ENTREPRENEURS who are:
- Developing new products and technologies
- Filing patents and protecting intellectual property
- Seeking funding and partnerships
- Building innovative businesses
- Navigating R&D challenges

Focus on:
- Innovation and product development opportunities
- Patent filing and IP protection timing
- Commercialization and funding prospects  
- Strategic business decisions
- R&D breakthroughs and challenges
- Partnership and collaboration opportunities
- Timing for key business actions

Include specific sections with headers:
**Innovation & Product Development**
**Patent & IP Protection**
**Commercialization & Funding**
**Strategic Planning**
**Inventor's Personal Growth**

CRITICAL INSTRUCTIONS:
1. Be realistic and balanced - include BOTH opportunities AND challenges
2. NEVER be overly optimistic - inventors face real obstacles
3. Include specific challenges they might encounter
4. Give actionable advice for handling difficulties
5. Mention timing for decisions (e.g., "early this week", "mid-month")
6. Keep the overall message constructive but honest

Make it feel like helpful cosmic guidance specifically tailored for inventors, not generic horoscope advice. Be authentic, realistic, and valuable.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }, 3, 2000); // 3 retries, starting with 2 second delay

    // Cache the result
    cache.set(cacheKey, {
      horoscope: horoscopeText,
      timestamp: Date.now()
    });

    return res.status(200).json({
      horoscope: horoscopeText,
      cached: false,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating horoscope:', error);
    
    // Check if it's a 503 error
    const is503 = error.message?.includes('503') || 
                  error.message?.includes('overloaded') ||
                  error.message?.includes('UNAVAILABLE');
    
    if (is503) {
      return res.status(503).json({
        error: 'Google\'s AI service is temporarily overloaded',
        details: 'Please try again in a few moments',
        userMessage: 'The cosmic energies are experiencing high demand. Please try selecting your sign again in a moment! ✨'
      });
    }
    
    return res.status(500).json({
      error: 'Failed to generate horoscope',
      details: error.message
    });
  }
}
