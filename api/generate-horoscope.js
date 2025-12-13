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
        
        Include predictions about:
        - Love and relationships
        - Career and finances
        - Health and wellness
        - Lucky numbers and colors
        
        Make it engaging, positive yet realistic, and written in a mystical, encouraging tone. Keep it between 150-200 words.`
      },
      weekly: {
        content: `Generate a detailed, mystical weekly horoscope for ${sign.name} (${sign.dates}) for the week starting ${today}.
        
        Provide an overview of the week ahead with predictions for:
        - Love and relationships throughout the week
        - Career opportunities and challenges
        - Financial outlook
        - Health and wellness focus
        - Key days to watch (lucky days)
        - Weekly lucky numbers and colors
        
        Make it engaging, insightful, positive yet realistic, and written in a mystical, encouraging tone. Keep it between 250-300 words.`
      },
      monthly: {
        content: `Generate a comprehensive, mystical monthly horoscope for ${sign.name} (${sign.dates}) for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
        
        Provide an in-depth analysis of the month ahead with predictions for:
        - Love and relationships: Major themes and developments
        - Career and professional growth: Opportunities and warnings
        - Financial outlook: Income, spending, investments
        - Health and wellness: Physical and mental focus areas
        - Personal growth and spiritual development
        - Key dates and important planetary influences
        - Monthly lucky numbers, colors, and gemstones
        
        Make it comprehensive, insightful, positive yet realistic, and written in a mystical, encouraging tone with astrological depth. Keep it between 350-400 words.`
      }
    };

    const selectedPrompt = prompts[timeframe];

    if (!selectedPrompt) {
      return res.status(400).json({ error: 'Invalid timeframe' });
    }

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not configured. Please add ANTHROPIC_API_KEY to your Vercel environment variables.' 
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: selectedPrompt.content
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to generate horoscope',
        details: errorData 
      });
    }

    const data = await response.json();
    const horoscopeText = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
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
