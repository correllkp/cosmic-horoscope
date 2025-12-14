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

    // Create cache keys for all three timeframes
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKeys = {
      daily: `${sign.name}-daily-${todayDate}`,
      weekly: `${sign.name}-weekly-${todayDate}`,
      monthly: `${sign.name}-monthly-${todayDate}`
    };

    // Check if ALL THREE are cached and valid
    const dailyCached = horoscopeCache.get(cacheKeys.daily);
    const weeklyCached = horoscopeCache.get(cacheKeys.weekly);
    const monthlyCached = horoscopeCache.get(cacheKeys.monthly);

    const dailyValid = dailyCached && (Date.now() - dailyCached.timestamp < CACHE_DURATION.daily);
    const weeklyValid = weeklyCached && (Date.now() - weeklyCached.timestamp < CACHE_DURATION.weekly);
    const monthlyValid = monthlyCached && (Date.now() - monthlyCached.timestamp < CACHE_DURATION.monthly);

    // If the requested timeframe is cached and valid, return it immediately
    const requestedCached = horoscopeCache.get(cacheKeys[timeframe]);
    const requestedValid = requestedCached && (Date.now() - requestedCached.timestamp < CACHE_DURATION[timeframe]);

    if (requestedValid) {
      console.log(`Serving cached horoscope for ${cacheKeys[timeframe]}`);
      return res.status(200).json({ 
        horoscope: requestedCached.content,
        cached: true,
        strategy: 'single-cached'
      });
    }

    // If ANY of the three are missing or invalid, generate ALL THREE
    console.log(`Generating all three horoscopes for ${sign.name} (one or more missing/expired)`);

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

CRITICAL CONSISTENCY REQUIREMENTS:
1. This daily horoscope is DAY 1 of a larger story that will continue in weekly and monthly horoscopes
2. Introduce 1-2 main events/opportunities that will develop throughout the week and month
3. Introduce ONE technical challenge that starts small today but will escalate (mention it briefly as a minor issue or warning sign)
4. Use specific language like "Today" or "${today}" to make the timeframe clear
5. Foreshadow: Include phrases like "this will develop throughout the week" or "address this now before it compounds"

IMPORTANT: Include BOTH opportunities AND challenges. Be realistic - mention potential obstacles, warnings, or things to avoid. Not everything should be positive!

NARRATIVE STRUCTURE - Introduce these elements:
- ONE main business opportunity (licensing inquiry, partnership possibility, investor interest) - describe its ARRIVAL today
- ONE technical/creative challenge (minor inconsistency, small problem, warning sign) - just a hint, not a crisis yet
- Reference to how today's events will unfold over time

CRITICAL: You MUST use this EXACT format with headers on separate lines:

**Innovation & Creativity:**
Write 2-3 sentences. Introduce a creative opportunity or breakthrough moment. Then mention a SMALL creative challenge or perfectionism tendency that surfaces today (this will grow in weekly/monthly). Balance opportunity with minor warning.

**Business & Commercialization:**
Write 2-3 sentences. Introduce ONE specific business opportunity that emerges TODAY (e.g., "A licensing inquiry arrives via email" or "An unexpected partnership possibility surfaces"). This should be something that will develop throughout the week. Include advice to prepare thoroughly before engaging. Naturally mention consulting https://patentwerks.ai for patent guidance or https://ipservices.us for IP services before taking action.

**Mindset & Strategy:**
Write 2-3 sentences about today's strategic approach. Reference the ${sign.name} zodiac sign's core personality traits (research them!). Include a warning about a typical ${sign.name} weakness that might surface today (e.g., Taurus: stubbornness, Gemini: scattered focus, etc.).

**Cosmic Guidance for Inventors:**
Write 1-2 sentences of mystical advice - include both what to embrace today AND what to avoid. End with forward-looking hint: "What starts today unfolds throughout the week."

**Lucky Elements:**
Generate exactly 2 lucky numbers (these will be the FOUNDATION numbers that also appear in weekly and monthly)
Generate exactly 1 lucky color (this will be the CORE color that also appears in weekly and monthly)

Format:
Lucky Numbers: [number], [number]
Lucky Color: [specific color name that matches ${sign.name}'s element - Fire: reds/oranges, Earth: greens/browns, Air: yellows/blues, Water: blues/purples]

DO NOT write this as a flowing paragraph. Each section header MUST be on its own line followed by the content on the next line. Use a blank line between each section.

Make it mystical, realistic, balanced between positive and cautionary, and authentic. Include specific warnings or challenges. 150-200 words total.`
      },
      weekly: {
        content: `You are generating a weekly INVENTOR'S horoscope for ${sign.name} (${sign.dates}) for the week starting ${today}.

This horoscope is for inventors, entrepreneurs, and innovators. Focus on invention, patents, intellectual property, R&D, prototyping, and commercialization themes.

CRITICAL CONSISTENCY REQUIREMENTS:
1. This weekly horoscope continues the story from the DAILY horoscope (the first day of this week)
2. Reference events from "early in the week" or "from ${today}" as if they were introduced in the daily
3. Show PROGRESSION: The business opportunity from day 1 develops throughout the week
4. Show ESCALATION: The minor technical issue from day 1 becomes clearer and more serious
5. Include SPECIFIC DAY REFERENCES: Monday, Wednesday, Friday with different energies
6. Build toward monthly themes: hint that what happens this week is part of a larger pattern

IMPORTANT: Include BOTH opportunities AND challenges throughout the week. Be realistic - mention potential setbacks, warnings about timing, obstacles, or things that could go wrong. Balance optimism with caution!

NARRATIVE CONTINUITY - Reference the daily's events:
- The business opportunity that emerged "early in the week" or "on ${today}" - show it DEVELOPING
- The technical challenge that was a "minor issue at week's start" - show it becoming MORE CLEAR
- Use phrases like "that opportunity from early week," "the challenge first noticed on Monday," etc.

CRITICAL: You MUST use this EXACT format with headers on separate lines:

**Week Overview:**
Write 2-3 sentences. Reference how "the week that began with [opportunity/challenge from daily] unfolds with both progress and obstacles." Include both favorable conditions AND specific challenges. Mention that events from early week develop by mid-week.

**Innovation & R&D:**
Write 3-4 sentences. Reference the technical challenge from daily (e.g., "that minor inconsistency from early week becomes clearer"). Show it escalating from mild to moderate. Describe how it requires iteration or adjustment. Balance setbacks with breakthroughs - by Friday there's progress despite the challenges.

**Patent & IP Strategy:**
Write 3-4 sentences. Connect to the business opportunity from daily - now that discussions are advancing, IP protection becomes more urgent. Include warnings about deadlines or documentation gaps. Mention timing being fortunate for addressing these NOW before they become bigger problems. Naturally mention consulting experts at https://patentwerks.ai for patent strategy or https://ipservices.us for comprehensive IP services, especially before advancing negotiations.

**Commercialization & Partnerships:**
Write 2-3 sentences. Show the business opportunity from daily PROGRESSING: "The [licensing/partnership] inquiry from early week gains traction by mid-week." Include realistic obstacles: negotiations slower than hoped, potential deals that may fall through, need for patience. End with clarity about which opportunities are viable.

**Inventor's Mindset:**
Write 2-3 sentences referencing ${sign.name}'s core traits. Acknowledge that mid-week brings moments of doubt when challenges and slow progress collide. Emphasize ${sign.name}'s key strength (persistence, adaptability, etc.) as the solution. Warn about burnout and recommend specific self-care.

**Key Days:**
List exactly 3 days with specific descriptions (one positive, one challenging, one mixed):

Monday, [Month Day] - [Grounded/productive energy OR reference to continuing daily's momentum]
Wednesday, [Month Day] - [Communication challenges/obstacles OR technical issues surface more clearly]  
Friday, [Month Day] - [Strategic clarity/breakthrough OR resolution emerging after overcoming obstacles]

Example format:
Monday, December 16 - Grounded productivity; ideal for hands-on work continuing from weekend's insights
Wednesday, December 18 - Communication challenges in negotiations; review all terms meticulously
Friday, December 20 - Strategic clarity emerges; perfect for refining vision after overcoming week's hurdles

**Weekly Lucky Elements:**
Generate exactly 4 lucky numbers - MUST INCLUDE the 2 foundation numbers from daily, plus 2 new ones
Generate exactly 2 lucky colors - MUST INCLUDE the 1 core color from daily, plus 1 new one

Format:
Numbers: [daily #1], [daily #2], [new #3], [new #4]
Colors: [daily color], [new complementary color]

Colors should be specific and match ${sign.name}'s element (Fire: reds/oranges/golds, Earth: greens/browns/bronze, Air: yellows/blues/silver, Water: blues/purples/silver)

DO NOT write this as a flowing paragraph. Each section header MUST be on its own line. Use blank lines between sections.

Make it comprehensive, mystical, balanced between opportunities and realistic challenges, and authentic for inventors. Reference ${sign.name}'s personality throughout. 250-300 words total.`
      },
      monthly: {
        content: `You are generating a comprehensive monthly INVENTOR'S horoscope for ${sign.name} (${sign.dates}) for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.

This horoscope is for inventors, entrepreneurs, patent holders, and innovators. Focus on invention cycles, patent processes, product development, funding, and commercialization.

CRITICAL CONSISTENCY REQUIREMENTS:
1. This monthly horoscope COMPLETES the story that began in daily and developed in weekly
2. Reference specific dates - especially mention events from early in the month (around ${today})
3. Show FULL ARC: Setup (early month) → Crisis (mid-month) → Resolution/Breakthrough (late month)
4. The business opportunity from early month must face obstacles then reach conclusion
5. The technical challenge from early month must escalate to major issue then lead to breakthrough
6. Create REDEMPTIVE ARC: What seems like failure mid-month becomes breakthrough by month's end

IMPORTANT: Include BOTH opportunities AND challenges throughout the month. Be realistic - mention potential major setbacks, difficult periods, funding challenges, patent rejections, or manufacturing issues. Include warnings about timing and what to avoid. Balance optimism with realistic caution!

NARRATIVE COMPLETION - Three-Act Structure:
ACT 1 (Early Month, Days 1-10): Reference the opportunity/challenge from "${today}" - show initial progress
ACT 2 (Mid-Month, Days 11-20): The technical issue becomes a MAJOR problem; opportunity faces setbacks
ACT 3 (Late Month, Days 21-31): Breakthrough emerges; "setback" was actually a blessing in disguise

CRITICAL: You MUST use this EXACT format with headers on separate lines:

**Monthly Overview:**
Write 3-4 sentences creating a complete story arc. Reference how "the month that began with [opportunity from early month around ${today}] brings both challenges and ultimate breakthroughs." Mention specific timeframes: "Early ${new Date().toLocaleDateString('en-US', { month: 'long' })} (1-10) brings momentum, mid-month (11-20) tests patience with obstacles, late month (21-31) delivers unexpected wins." Include ${sign.name}'s personality traits in how they navigate this journey.

**Innovation & Product Development:**
Write 4-5 sentences following the THREE-ACT structure:
- EARLY MONTH: Good progress on the work begun around ${today}
- MID-MONTH (specific dates like ${new Date().getDate()}-${new Date().getDate() + 7}): The minor technical issue from early month reveals itself as MAJOR problem - design flaw, compatibility issue, etc. Describe specific consequences: costs increase X%, timeline delays, need for redesign
- LATE MONTH: The forced pivot actually creates SUPERIOR solution that's more marketable
Include warnings about not missing the early warning signs.

**Patent & IP Protection:**
Write 4-5 sentences with specific timeline:
- EARLY MONTH (Days 1-10): Favorable window for filing; reference any IP needs created by the business opportunity from ${today}
- MID-MONTH (Days 11-20): As technical issues surface, patent claims need revision; office actions may arrive; prior art conflicts possible
- LATE MONTH (Days 21-31): Revised claims are actually STRONGER than originals
Mention consulting experts at https://patentwerks.ai for patent guidance and https://ipservices.us for comprehensive IP services, especially during the challenging mid-month filing period when design pivots require claim amendments.

**Commercialization & Funding:**
Write 3-4 sentences showing the business opportunity's journey:
- EARLY MONTH: The opportunity from ${today} develops into substantive discussions
- MID-MONTH: Technical delays cause skepticism; deals slow or pause; costs increase
- LATE MONTH: Improved solution actually STRENGTHENS the opportunity; partners re-engage
Include realistic warnings about funding gaps during the transition period.

**Strategic Planning:**
Write 3-4 sentences about competitive landscape and decisions. Warn against impulsive scaling during mid-month chaos (around day ${new Date().getDate() + 5}-${new Date().getDate() + 10}). Emphasize focusing on core value proposition before diversifying. A competitor's announcement might actually validate the market or reveal your pivot was strategically essential.

**Inventor's Personal Growth:**
Write 3-4 sentences following emotional arc for ${sign.name}:
- EARLY MONTH: Confidence and momentum
- MID-MONTH (specific dates): Mental test; potential imposter syndrome around day ${new Date().getDate() + 8}-${new Date().getDate() + 10}; critical moment of wanting to quit
- LATE MONTH: Resilience pays off; personal growth from persevering through struggle
Reference ${sign.name}'s core strength (Aries: courage, Taurus: persistence, Gemini: adaptability, etc.) as what carries them through.

**Key Dates:**
List exactly 4-5 specific dates spanning the month with clear progression:

${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - [Reference the opportunity/challenge that emerges; this is the STARTING POINT]
[Month] ${Math.min(new Date().getDate() + 3, 28)} - [Early progress or important milestone]
[Month] ${Math.min(new Date().getDate() + 8, 28)} - [Crisis point: technical issues crystallize OR negotiations face major obstacle]
[Month] ${Math.min(new Date().getDate() + 14, 31)} - [Breakthrough moment: solution emerges after struggle]
[Month] ${Math.min(new Date().getDate() + 21, 31)} - [Resolution: clarity about next steps; strengthened position]

Example format showing progression:
December 14 - Licensing opportunity emerges; minor technical inconsistency surfaces
December 17 - Critical negotiations day; attention to detail required
December 19 - Technical issues crystallize into design flaw requiring pivot; initial despair
December 23 - Breakthrough moment after intense struggle; superior solution emerges
December 28 - Strategic clarity; relationships that seemed lost actually strengthen

**Monthly Lucky Elements:**
Generate exactly 5-7 lucky numbers - MUST INCLUDE all 4 numbers from weekly, plus 1-3 new ones
Generate exactly 2-3 lucky colors - MUST INCLUDE both colors from weekly, plus optionally 1 new one
Generate exactly 1 lucky gemstone that matches ${sign.name}'s element and represents transformation/resilience

Format:
Numbers: [weekly #1], [weekly #2], [weekly #3], [weekly #4], [new #5], [optionally new #6-7]
Colors: [weekly color 1], [weekly color 2], [optionally new color 3]
Gemstone: [specific gemstone - Fire: Ruby/Carnelian, Earth: Emerald/Jade, Air: Aquamarine/Citrine, Water: Sapphire/Amethyst]

DO NOT write this as a flowing paragraph. Each section header MUST be on its own line. Use blank lines between sections.

Make it comprehensive, mystical, balanced between opportunities and realistic challenges, and authentic for inventors. Reference ${sign.name}'s personality and journey throughout. Create a complete redemptive narrative arc. 400-450 words total.`
      }
    };

    // Helper function to generate a single horoscope
    const generateSingleHoroscope = async (promptContent, timeframeName) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptContent
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,  // Increased to 4096 to prevent cutoffs on weekly/monthly
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Gemini API error for ${timeframeName}:`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
          sign: sign.name,
          timeframe: timeframeName
        });
        throw new Error(`Failed to generate ${timeframeName}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error(`Unexpected Gemini response for ${timeframeName}:`, data);
        throw new Error(`Unexpected response for ${timeframeName}`);
      }

      return data.candidates[0].content.parts
        .map(part => part.text)
        .join('\n');
    };

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not configured. Please add GEMINI_API_KEY to your Vercel environment variables.' 
      });
    }

    // Generate ALL THREE horoscopes
    console.log(`Generating all three horoscopes for ${sign.name}...`);
    
    try {
      // Generate all three in parallel for speed
      const [dailyText, weeklyText, monthlyText] = await Promise.all([
        generateSingleHoroscope(prompts.daily.content, 'daily'),
        generateSingleHoroscope(prompts.weekly.content, 'weekly'),
        generateSingleHoroscope(prompts.monthly.content, 'monthly')
      ]);

      // Cache all three horoscopes
      horoscopeCache.set(cacheKeys.daily, {
        content: dailyText,
        timestamp: Date.now()
      });
      
      horoscopeCache.set(cacheKeys.weekly, {
        content: weeklyText,
        timestamp: Date.now()
      });
      
      horoscopeCache.set(cacheKeys.monthly, {
        content: monthlyText,
        timestamp: Date.now()
      });

      console.log(`Generated and cached all three horoscopes for ${sign.name}`);

      // Return the requested timeframe
      const horoscopeTexts = {
        daily: dailyText,
        weekly: weeklyText,
        monthly: monthlyText
      };

      return res.status(200).json({ 
        horoscope: horoscopeTexts[timeframe],
        cached: false,
        strategy: 'generated-all-three',
        note: 'All three timeframes now cached for instant access'
      });

    } catch (error) {
      // Handle generation errors
      if (error.message.includes('429') || error.message.includes('Rate limit')) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please wait before making more requests.',
          details: 'Gemini API rate limit (15 requests per minute)'
        });
      } else if (error.message.includes('401') || error.message.includes('403')) {
        return res.status(500).json({ 
          error: 'API authentication failed',
          details: 'Check GEMINI_API_KEY environment variable'
        });
      } else {
        throw error; // Re-throw to be caught by outer catch
      }
    }

  } catch (error) {
    console.error('Error in horoscope API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
