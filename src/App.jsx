import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Moon, Sun, Star, Calendar } from 'lucide-react';
import PersonalizedOverlay from './components/PersonalizedOverlay';

const zodiacSigns = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire', color: 'from-red-500 to-orange-500' },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20', element: 'Earth', color: 'from-green-600 to-emerald-500' },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20', element: 'Air', color: 'from-yellow-400 to-amber-500' },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22', element: 'Water', color: 'from-blue-400 to-cyan-500' },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire', color: 'from-orange-500 to-yellow-500' },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth', color: 'from-green-500 to-teal-500' },
  { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22', element: 'Air', color: 'from-pink-400 to-rose-500' },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21', element: 'Water', color: 'from-purple-600 to-indigo-600' },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire', color: 'from-purple-500 to-pink-500' },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth', color: 'from-gray-600 to-slate-700' },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18', element: 'Air', color: 'from-cyan-400 to-blue-500' },
  { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'Water', color: 'from-indigo-400 to-purple-500' }
];

export default function HoroscopeApp() {
  const [selectedSign, setSelectedSign] = useState(null);
  const [horoscope, setHoroscope] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('daily'); // daily, weekly, monthly
  const horoscopeRef = useRef(null);

  // NEW: Birth date state with localStorage persistence
  const [birthDate, setBirthDate] = useState(() => {
    return localStorage.getItem('birthDate') || '';
  });

  // NEW: Save birth date to localStorage when it changes
  useEffect(() => {
    if (birthDate) {
      localStorage.setItem('birthDate', birthDate);
    }
  }, [birthDate]);

  // Auto-scroll to horoscope when a sign is selected
  useEffect(() => {
    if (selectedSign && horoscopeRef.current) {
      horoscopeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSign]);

  // Function to convert URLs in text to clickable links
  const linkifyText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-300 hover:text-yellow-200 underline transition-colors"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const generateHoroscope = async (sign) => {
    setLoading(true);
    setSelectedSign(sign);
    setHoroscope('');

    try {
      const response = await fetch('/api/generate-horoscope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sign: {
            name: sign.name,
            dates: sign.dates
          },
          timeframe: timeframe
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Show specific error based on status code
        if (response.status === 429) {
          throw new Error('Rate limit reached. Please wait a moment before trying again.');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('API authentication issue. Please contact support.');
        } else {
          throw new Error(data.error || 'Failed to generate horoscope');
        }
      }
      
      setHoroscope(data.horoscope);
    } catch (error) {
      // Show user-friendly error message
      let errorMessage = 'The cosmic energies are currently unavailable. ';
      
      if (error.message.includes('Rate limit')) {
        errorMessage = '⏳ Too many requests! The stars need a moment to realign. Please wait 30 seconds and try again.';
      } else if (error.message.includes('authentication')) {
        errorMessage = '🔒 API configuration issue. Please contact the site administrator.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = '🌐 Network connection issue. Please check your internet and try again.';
      } else {
        errorMessage = '✨ The cosmic energies are currently unavailable. Please try again in a moment.';
      }
      
      setHoroscope(errorMessage);
      console.error('Error generating horoscope:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Moon className="w-8 h-8 text-yellow-300" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
            Cosmic Inventor's Horoscope
          </h1>
          <Sun className="w-8 h-8 text-yellow-300" />
        </div>
        <p className="text-purple-200 text-lg flex items-center justify-center gap-2">
          <Star className="w-4 h-4" />
          Discover what the stars have aligned for your inventions today
          <Star className="w-4 h-4" />
        </p>
        <p className="text-purple-300 mt-2">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* NEW: Birth Date Input */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-2xl p-4">
          <label className="block text-purple-200 mb-2 font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-yellow-300" />
            Your Birth Date <span className="text-sm font-normal text-purple-300">(optional - for personalized energy insights)</span>
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full p-3 rounded-xl bg-white bg-opacity-20 text-white border-2 border-purple-300 border-opacity-30 focus:border-opacity-60 focus:outline-none placeholder-purple-300"
          />
          {birthDate && (
            <p className="text-purple-200 text-xs mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-green-300" />
              Saved! You'll get personalized energy insights with each horoscope
            </p>
          )}
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-2 bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-full p-2">
          <button
            onClick={() => {
              setTimeframe('daily');
              if (selectedSign) generateHoroscope(selectedSign);
            }}
            className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-300 ${
              timeframe === 'daily'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-900 shadow-lg'
                : 'text-purple-200 hover:text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => {
              setTimeframe('weekly');
              if (selectedSign) generateHoroscope(selectedSign);
            }}
            className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-300 ${
              timeframe === 'weekly'
                ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg'
                : 'text-purple-200 hover:text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => {
              setTimeframe('monthly');
              if (selectedSign) generateHoroscope(selectedSign);
            }}
            className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-300 ${
              timeframe === 'monthly'
                ? 'bg-gradient-to-r from-indigo-400 to-cyan-400 text-white shadow-lg'
                : 'text-purple-200 hover:text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Monthly
          </button>
        </div>
        <p className="text-center text-purple-300 text-sm mt-3">
          {timeframe === 'daily' && 'Get your cosmic innovation guidance for today'}
          {timeframe === 'weekly' && 'Explore the week ahead for your inventions'}
          {timeframe === 'monthly' && 'Unlock your invention potential this month'}
        </p>
      </div>

      {/* Zodiac Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {zodiacSigns.map((sign) => (
          <button
            key={sign.name}
            onClick={() => generateHoroscope(sign)}
            className={`p-6 rounded-2xl bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 
                       hover:bg-opacity-20 transition-all duration-300 hover:scale-105 hover:shadow-2xl
                       ${selectedSign?.name === sign.name ? 'ring-2 ring-yellow-300 bg-opacity-20' : ''}`}
          >
            <div className="text-6xl mb-3" style={{ fontFamily: 'Arial, sans-serif' }}>
              {sign.symbol}
            </div>
            <div className="font-bold text-xl mb-1">{sign.name}</div>
            <div className="text-sm text-purple-200">{sign.dates}</div>
            <div className="text-xs text-purple-300 mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              {sign.element}
            </div>
          </button>
        ))}
      </div>

      {/* Horoscope Display */}
      {selectedSign && (
        <div ref={horoscopeRef} className="max-w-3xl mx-auto space-y-6">
          {/* Main Horoscope Card */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mb-4">
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                  timeframe === 'daily' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-900' :
                  timeframe === 'weekly' ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white' :
                  'bg-gradient-to-r from-indigo-400 to-cyan-400 text-white'
                }`}>
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Horoscope
                </span>
              </div>
              <div className="text-8xl mb-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                {selectedSign.symbol}
              </div>
              <h2 className="text-3xl font-bold mb-2">{selectedSign.name}</h2>
              <p className="text-purple-200">{selectedSign.dates}</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin mb-4">
                  <Sparkles className="w-12 h-12 text-yellow-300" />
                </div>
                <p className="text-purple-200">Channeling cosmic innovation energies...</p>
              </div>
            ) : horoscope ? (
              <div className="space-y-4">
                <div className="h-1 w-24 mx-auto bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 rounded-full mb-6"></div>
                <div className="text-lg leading-relaxed text-purple-50">
                  {horoscope.split('\n').map((line, index) => {
                    // Check if line contains bold markdown (headers)
                    if (line.includes('**')) {
                      const headerMatch = line.match(/\*\*([^*]+)\*\*/);
                      if (headerMatch) {
                        return (
                          <h3 key={index} className="text-yellow-300 text-xl font-bold mb-3 mt-6 first:mt-0">
                            {linkifyText(headerMatch[1])}
                          </h3>
                        );
                      }
                    }
                    // Regular paragraph text
                    if (line.trim()) {
                      return (
                        <p key={index} className="mb-4 leading-relaxed">
                          {linkifyText(line)}
                        </p>
                      );
                    }
                    // Empty line for spacing
                    return <div key={index} className="h-2"></div>;
                  })}
                </div>
                <div className="h-1 w-24 mx-auto bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 rounded-full mt-6"></div>
              </div>
            ) : null}
          </div>

          {/* NEW: Personalized Energy Overlay */}
          {horoscope && birthDate && !loading && (
            <PersonalizedOverlay 
              horoscope={horoscope}
              birthDate={birthDate}
              timeframe={timeframe}
            />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-12 text-center text-purple-300 text-sm">
        <p className="flex items-center justify-center gap-2 mb-4">
          <Star className="w-4 h-4" />
          Powered by AI cosmic intelligence
          <Star className="w-4 h-4" />
        </p>
        
        {/* Professional Resources - SEO & User-Visible */}
        <div className="mt-6 pt-6 border-t border-purple-500 border-opacity-30">
          <p className="text-purple-200 text-xs mb-3 font-semibold">
            Professional Resources for Inventors
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <a 
              href="https://patentwerks.ai" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-300 hover:text-yellow-200 underline transition-colors font-medium"
              aria-label="Patent filing and strategy services"
            >
              PatentWerks - Expert Patent Services
            </a>
            <span className="text-purple-400 hidden sm:inline">•</span>
            <a 
              href="https://ipservices.us" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-300 hover:text-yellow-200 underline transition-colors font-medium"
              aria-label="Comprehensive IP protection services"
            >
              IP Services - Intellectual Property Protection
            </a>
          </div>
          <p className="text-purple-400 text-xs mt-3 max-w-2xl mx-auto">
            Professional guidance for patent filing, IP strategy, and protecting your innovations
          </p>
        </div>
      </div>
    </div>
  );
}
