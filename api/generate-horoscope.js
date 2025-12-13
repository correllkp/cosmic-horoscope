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

    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const prompts = {
      daily: {
        content: `Generate a detailed, mystical daily horoscope for ${sign.name} (${sign.dates}) for ${today}.

Format with clear sections using this EXACT structure with line breaks:

**Love & Relationships:**
[2-3 sentences about love, romance, and connections]

**Career & Finances:**
[2-3 sentences about work opportunities and money matters]

**Health & Wellness:**
[2-3 sentences about physical and mental well-being]

**Cosmic Guidance:**
[1-2 sentences of mystical advice for the day]

**Lucky Elements:**
Numbers: [3 numbers]
Color: [1 color]

Important: Put each section header on its own line, followed by the content. Use blank lines between sections.

Make it engaging, positive yet realistic, and written in a mystical, encouraging tone. Keep it between 150-200 words total.`
      },
      weekly: {
        content: `Generate a detailed, mystical weekly horoscope for ${sign.name} (${sign.dates}) for the week starting ${today}.

Format with clear sections using this EXACT structure with line breaks:

**Week Overview:**
[2-3 sentences setting the tone for the week ahead]

**Love & Relationships:**
[3-4 sentences about romantic developments throughout the week]

**Career & Professional Growth:**
[3-4 sentences about work opportunities and challenges]

**Financial Outlook:**
[2-3 sentences about money matters and financial decisions]

**Health & Wellness:**
[2-3 sentences about physical and mental well-being focus]

**Key Days to Watch:**
[List 2-3 specific days with brief notes]

**Weekly Lucky Elements:**
Numbers: [3-4 numbers]
Colors: [2 colors]

Important: Put each section header on its own line, followed by the content. Use blank lines between sections.

Make it engaging, insightful, positive yet realistic, and written in a mystical, encouraging tone. Keep it between 250-300 words total.`
      },
      monthly: {
        content: `Generate a comprehensive, mystical monthly horoscope for ${sign.name} (${sign.dates}) for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.

Format with clear sections using this EXACT structure with line breaks:

**Monthly Overview:**
[3-4 sentences setting the cosmic tone for the entire month]

**Love & Relationships:**
[4-5 sentences about major romantic themes and developments]

**Career & Professional Growth:**
[4-5 sentences about work opportunities, challenges, and advancement]

**Financial Outlook:**
[3-4 sentences about income, spending, and investment guidance]

**Health & Wellness:**
[3-4 sentences about physical and mental health focus areas]

**Personal Growth & Spirituality:**
[3-4 sentences about inner development and spiritual themes]

**Key Dates & Planetary Influences:**
[List 3-4 important dates with brief cosmic explanations]

**Monthly Lucky Elements:**
Numbers: [4-5 numbers]
Colors: [2-3 colors]
Gemstone: [1 gemstone]

Important: Put each section header on its own line, followed by the content. Use blank lines between sections.

Make it comprehensive, insightful, positive yet realistic, and written in a mystical, encouraging tone with astrological depth. Keep it between 350-400 words total.`
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

    // Use Google Gemini API (v1 endpoint)
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
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to generate horoscope',
        details: errorData 
      });
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

    return res.status(200).json({ horoscope: horoscopeText });

  } catch (error) {
    console.error('Error in horoscope API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
