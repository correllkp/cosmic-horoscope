// api/generate-horoscope.js
// Option B: Generates all three timeframes together for consistency
// Includes: Retry logic, SEO links, Higher token limit

import { GoogleGenerativeAI } from '@google/generative-ai';

// In-memory cache for complete horoscope sets
const cache = new Map();

function getCacheKey(signName, date) {
  return `${signName}-${date}`;
}

function isCacheValid(cacheEntry) {
  if (!cacheEntry) return false;
  
  const now = Date.now();
  const age = now - cacheEntry.timestamp;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  return age < ONE_DAY;
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
      
      const is503 = error.message?.includes('503') || 
                    error.message?.includes('overloaded') ||
                    error.message?.includes('UNAVAILABLE');
      
      if (is503 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Gemini API overloaded (503), retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
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
    const { sign, timeframe = 'daily' } = req.body;

    if (!sign || !sign.name) {
      return res.status(400).json({ error: 'Sign information is required' });
    }

    // Check cache for complete horoscope set
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = getCacheKey(sign.name, today);
    const cachedEntry = cache.get(cacheKey);

    // If we have valid cached data, return the requested timeframe
    if (isCacheValid(cachedEntry)) {
      console.log(`Cache HIT for ${sign.name} - returning ${timeframe}`);
      return res.status(200).json({
        horoscope: cachedEntry.horoscopes[timeframe],
        cached: true,
        generatedAt: new Date(cachedEntry.timestamp).toISOString()
      });
    }

    // Cache miss or expired - generate all three together
    console.log(`Cache MISS for ${sign.name} - generating all three horoscopes together`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      throw new Error('API key not configured');
    }

    // Generate all three horoscopes in one unified request
    const allHoroscopes = await retryWithBackoff(async () => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          maxOutputTokens: 16384, // Even higher for generating 3 at once
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

      // Week calculation
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Month name
      const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const prompt = `Generate THREE integrated horoscopes for ${sign.name} - daily, weekly, and monthly - that tell a cohesive story. These should be connected predictions where the daily builds into the weekly, and the weekly expands into the monthly themes.

TODAY'S DATE: ${dateStr}
THIS WEEK: ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}
THIS MONTH: ${monthName}

These horoscopes are specifically for INVENTORS and ENTREPRENEURS who are:
- Developing new products and technologies
- Filing patents and protecting intellectual property
- Seeking funding and partnerships
- Building innovative businesses
- Navigating R&D challenges

CRITICAL: Each horoscope should be COMPLETE with full paragraphs (2-3 paragraphs per section minimum). No empty headers, no incomplete thoughts.

For EACH timeframe, include these sections:
**Innovation & Product Development**
**Patent & IP Protection**
**Commercialization & Funding**
**Strategic Planning**
**Inventor's Personal Growth**

IMPORTANT - Naturally integrate these business links in the Patent & IP sections:
- When discussing patent strategy: "For expert guidance on patent strategy and filing, professional support is available at https://patentwerks.ai"
- When discussing IP services: "Comprehensive IP services for inventors are available at https://ipservices.us"

INTEGRATION REQUIREMENTS:
1. Daily should introduce immediate themes and actions
2. Weekly should expand on daily themes and introduce mid-range strategy
3. Monthly should encompass both and provide big-picture guidance
4. All three should reference the same core cosmic energies
5. Timing should be specific: "today", "this week", "this month"
6. Challenges mentioned in daily should connect to solutions in weekly/monthly

CONTENT REQUIREMENTS:
1. Be realistic and balanced - include BOTH opportunities AND challenges
2. NEVER be overly optimistic - inventors face real obstacles
3. Give actionable advice with specific timing
4. Each section needs 2-3 FULL paragraphs with complete sentences
5. Write detailed, specific guidance - not vague generalizations

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

===DAILY===
[Complete daily horoscope with all sections and full content]

===WEEKLY===
[Complete weekly horoscope with all sections and full content]

===MONTHLY===
[Complete monthly horoscope with all sections and full content]

Make sure each horoscope is complete, detailed, and integrated with the others. ENSURE ALL SECTIONS HAVE FULL CONTENT.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const fullText = response.text();

      // Parse the three horoscopes
      const dailyMatch = fullText.match(/===DAILY===([\s\S]*?)(?:===WEEKLY===|$)/);
      const weeklyMatch = fullText.match(/===WEEKLY===([\s\S]*?)(?:===MONTHLY===|$)/);
      const monthlyMatch = fullText.match(/===MONTHLY===([\s\S]*?)$/);

      if (!dailyMatch || !weeklyMatch || !monthlyMatch) {
        console.error('Failed to parse horoscopes - format not matched');
        throw new Error('AI response format error');
      }

      return {
        daily: dailyMatch[1].trim(),
        weekly: weeklyMatch[1].trim(),
        monthly: monthlyMatch[1].trim()
      };
    }, 3, 2000);

    // Validate we got substantial content
    Object.entries(allHoroscopes).forEach(([timeframe, text]) => {
      if (text.length < 500) {
        console.warn(`${timeframe} horoscope seems too short (${text.length} chars)`);
      }
    });

    // Cache the complete set
    cache.set(cacheKey, {
      horoscopes: allHoroscopes,
      timestamp: Date.now()
    });

    console.log(`Successfully generated and cached all three horoscopes for ${sign.name}`);

    // Return the requested timeframe
    return res.status(200).json({
      horoscope: allHoroscopes[timeframe],
      cached: false,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating horoscope:', error);
    
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
