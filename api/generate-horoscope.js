// Simple in-memory cache (resets on each deployment)
const horoscopeCache = new Map();

// Cache duration: Daily horoscopes cache for 24 hours, Weekly for 7 days, Monthly for 30 days
const CACHE_DURATION = {
  daily: 24 * 60 * 60 * 1000,    // 24 hours
  weekly: 7 * 24 * 60 * 60 * 1000,  // 7 days
  monthly: 30 * 24 * 60 * 60 * 1000  // 30 days
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sign, timeframe } = req.body;

    if (!sign || !timeframe) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create cache key based on sign, timeframe, and current date
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `${sign.name}-${timeframe}-${todayDate}`;
    
    // Check if we have a cached version
    const cached = horoscopeCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION[timeframe])) {
      console.log(`Serving cached horoscope for ${cacheKey}`);
      return res.status(200).json({ 
        horoscope: cached.content,
        cached: true 
      });
    }

    // Format today's date for the prompt
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const prompts = {
      daily: {
        content: `You are generating a daily INVENTOR'S horoscope for ${sign.name} (${sign.dates}) for ${today}.

This horoscope is for inventors, entrepreneurs, and innovators. Focus on invention, patents, intellectual property, creativity, and innovation themes.

IMPORTANT: Include BOTH opportunities AND challenges. Be realistic - mention potential obstacles, warnings, or things to avoid. Not everything should be positive!

CRITICAL: You MUST use this EXACT format with headers on separate lines. Copy this structure exactly:

**Innovation & Creativity:**
Write 2-3 sentences. Include both creative opportunities AND potential creative blocks or challenges to overcome.

**Business & Commercialization:**
Write 2-3 sentences about bringing inventions to market, business opportunities, licensing, or partnerships. Include warnings about potential pitfalls or delays. Naturally mention checking resources at https://patentwerks.ai for patent guidance or https://ipservices.us for IP services when facing challenges.

**Mindset & Strategy:**
Write 2-3 sentences. Include both strategic opportunities AND warnings about rushed decisions, distractions, or obstacles to watch out for.

**Cosmic Guidance for Inventors:**
Write 1-2 sentences of mystical advice - include both what to embrace AND what to avoid today.

**Lucky Elements:**
Numbers: 3, 7, 21
Color: Emerald Green

DO NOT write this as a flowing paragraph. Each section header MUST be on its own line followed by the content on the next line. Use a blank line between each section.

Make it mystical, realistic, balanced between positive and cautionary, and authentic. Include specific warnings or challenges. 150-200 words total.`
      },
      weekly: {
        content: `You are generating a weekly INVENTOR'S horoscope for ${sign.name} (${sign.dates}) for the week starting ${today}.

This horoscope is for inventors, entrepreneurs, and innovators. Focus on invention, patents, intellectual property, R&D, prototyping, and commercialization themes.

IMPORTANT: Include BOTH opportunities AND challenges throughout the week. Be realistic - mention potential setbacks, warnings about timing, obstacles, or things that could go wrong. Balance optimism with caution!

CRITICAL: You MUST use this EXACT format with headers on separate lines. Copy this structure exactly:

**Week Overview:**
Write 2-3 sentences about the week's overall energy. Include both favorable conditions AND potential challenges or obstacles ahead.

**Innovation & R&D:**
Write 3-4 sentences about research, development, prototyping, testing, or creative breakthroughs this week. Warn about potential technical setbacks or failed experiments.

**Patent & IP Strategy:**
Write 3-4 sentences about protecting inventions, filing patents, IP strategy, or legal considerations. Include warnings about deadlines, documentation issues, or potential conflicts. Naturally mention consulting with experts at https://patentwerks.ai for patent strategy or https://ipservices.us for comprehensive IP services, especially when facing challenges.

**Commercialization & Partnerships:**
Write 2-3 sentences about licensing deals, finding manufacturers, investor meetings, or business partnerships. Warn about potential deal delays, difficult negotiations, or partnerships that may fall through.

**Inventor's Mindset:**
Write 2-3 sentences about staying focused, overcoming setbacks, maintaining creative flow, or work-life balance. Include warnings about burnout, distractions, or self-doubt.

**Key Days:**
Monday - breakthrough moment, Wednesday - watch for obstacles, Friday - strategic planning but avoid rushed decisions

**Weekly Lucky Elements:**
Numbers: 5, 12, 18, 25
Colors: Azure Blue, Rose Gold

DO NOT write this as a flowing paragraph. Each section header MUST be on its own line. Use blank lines between sections.

Make it mystical, insightful, balanced between optimistic and cautionary, and authentic for inventors. Include specific warnings. 250-300 words total.`
      },
      monthly: {
        content: `You are generating a comprehensive monthly INVENTOR'S horoscope for ${sign.name} (${sign.dates}) for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.

This horoscope is for inventors, entrepreneurs, patent holders, and innovators. Focus on invention cycles, patent processes, product development, funding, and commercialization.

IMPORTANT: Include BOTH opportunities AND challenges throughout the month. Be realistic - mention potential major setbacks, difficult periods, funding challenges, patent rejections, or manufacturing issues. Include warnings about timing and what to avoid. Balance optimism with realistic caution!

CRITICAL: You MUST use this EXACT format with headers on separate lines. Copy this structure exactly:

**Monthly Overview:**
Write 3-4 sentences about the cosmic energy affecting invention and innovation this month. Include both favorable windows AND challenging periods to navigate.

**Innovation & Product Development:**
Write 4-5 sentences about major invention themes, product development cycles, prototyping milestones, or R&D breakthroughs. Include warnings about potential technical failures, delays, or design flaws that may emerge.

**Patent & IP Protection:**
Write 4-5 sentences about patent filing timelines, IP strategy decisions, trademark considerations, or protecting innovations. Warn about potential rejections, office actions, or legal complications. Mention consulting the experts at https://patentwerks.ai for patent guidance and https://ipservices.us for comprehensive IP services, especially during challenging filing periods.

**Commercialization & Funding:**
Write 3-4 sentences about bringing products to market, investor pitches, crowdfunding, licensing opportunities, or manufacturing partnerships. Include realistic warnings about funding gaps, rejected pitches, manufacturing delays, or deals that may not materialize.

**Strategic Planning:**
Write 3-4 sentences about long-term vision, competitive analysis, market positioning, or scaling strategies. Warn about competitors, market shifts, or strategic mistakes to avoid.

**Inventor's Personal Growth:**
Write 3-4 sentences about mental resilience, creative confidence, work-life integration, or networking. Include warnings about burnout, isolation, imposter syndrome, or loss of motivation during difficult periods.

**Key Dates:**
Dec 15 - patent milestone but expect delays, Dec 22 - investor opportunity (prepare for tough questions), Dec 28 - strategic breakthrough after overcoming setback

**Monthly Lucky Elements:**
Numbers: 2, 9, 14, 21, 28
Colors: Midnight Blue, Silver, Coral
Gemstone: Amethyst

DO NOT write this as a flowing paragraph. Each section header MUST be on its own line. Use blank lines between sections.

Make it comprehensive, mystical, balanced between opportunities and realistic challenges, and authentic for inventors. Include specific warnings and obstacles. 350-400 words total.`
      }
    };

    const selectedPrompt = prompts[timeframe];

    if (!selectedPrompt) {
      return res.status(400).json({ error: 'Invalid timeframe' });
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not configured. Please add GEMINI_API_KEY to your Vercel environment variables.' 
      });
    }

    // Use Google Gemini API - Using 2.5 Flash (newest stable model)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: selectedPrompt.content
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,  // Increased from 1024 to handle longer responses
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        sign: sign.name,
        timeframe
      });
      
      // Return specific error based on status code
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please wait before making more requests.',
          details: 'Gemini API rate limit (15 requests per minute)'
        });
      } else if (response.status === 401 || response.status === 403) {
        return res.status(response.status).json({ 
          error: 'API authentication failed',
          details: 'Check GEMINI_API_KEY environment variable'
        });
      } else {
        return res.status(response.status).json({ 
          error: 'Failed to generate horoscope',
          details: errorData 
        });
      }
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected Gemini response:', data);
      return res.status(500).json({ 
        error: 'Unexpected response from AI service' 
      });
    }

    const horoscopeText = data.candidates[0].content.parts
      .map(part => part.text)
      .join('\n');

    // Cache the generated horoscope
    horoscopeCache.set(cacheKey, {
      content: horoscopeText,
      timestamp: Date.now()
    });
    
    console.log(`Generated and cached new horoscope for ${cacheKey}`);

    return res.status(200).json({ 
      horoscope: horoscopeText,
      cached: false 
    });

  } catch (error) {
    console.error('Error in horoscope API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
