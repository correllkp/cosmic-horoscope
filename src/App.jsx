import React, { useState, useEffect } from 'react';
import './App.css';

const zodiacSigns = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19' },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20' },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20' },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22' },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22' },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22' },
  { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22' },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21' },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21' },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19' },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18' },
  { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20' },
];

function App() {
  const [selectedSign, setSelectedSign] = useState(null);
  const [timeframe, setTimeframe] = useState('daily');
  const [horoscope, setHoroscope] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [personalized, setPersonalized] = useState(false);
  const [natalSun, setNatalSun] = useState(null);
  const [transits, setTransits] = useState([]);

  // Biorhythm state
  const [birthDate, setBirthDate] = useState('');
  const [biorhythm, setBiorhythm] = useState(null);

  // Calculate zodiac sign from birthdate
  const getZodiacSignFromDate = (dateString) => {
    // Parse date string directly to avoid timezone issues
    // Date format from input is YYYY-MM-DD
    const parts = dateString.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]); // 1-12
    const day = parseInt(parts[2]);
    
    // Zodiac date ranges
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return zodiacSigns.find(s => s.name === 'Capricorn');
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return zodiacSigns.find(s => s.name === 'Aquarius');
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return zodiacSigns.find(s => s.name === 'Pisces');
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return zodiacSigns.find(s => s.name === 'Aries');
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return zodiacSigns.find(s => s.name === 'Taurus');
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return zodiacSigns.find(s => s.name === 'Gemini');
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return zodiacSigns.find(s => s.name === 'Cancer');
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return zodiacSigns.find(s => s.name === 'Leo');
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return zodiacSigns.find(s => s.name === 'Virgo');
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return zodiacSigns.find(s => s.name === 'Libra');
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return zodiacSigns.find(s => s.name === 'Scorpio');
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return zodiacSigns.find(s => s.name === 'Sagittarius');
    
    return null;
  };

  // Format date for display without timezone issues
  const formatBirthDate = (dateString) => {
    // Date format from input is YYYY-MM-DD
    const parts = dateString.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${month}/${day}/${year}`;
  };

  // Load birthdate from localStorage on mount
  useEffect(() => {
    const storedBirthDate = localStorage.getItem('birthDate');
    if (storedBirthDate) {
      setBirthDate(storedBirthDate);
      
      // Auto-calculate biorhythm
      const birth = new Date(storedBirthDate);
      const today = new Date();
      const daysSinceBirth = Math.floor((today - birth) / (1000 * 60 * 60 * 24));

      const physical = Math.sin((2 * Math.PI * daysSinceBirth) / 23) * 100;
      const emotional = Math.sin((2 * Math.PI * daysSinceBirth) / 28) * 100;
      const intellectual = Math.sin((2 * Math.PI * daysSinceBirth) / 33) * 100;

      setBiorhythm({
        physical: physical.toFixed(1),
        emotional: emotional.toFixed(1),
        intellectual: intellectual.toFixed(1),
      });

      // Auto-select zodiac sign
      const calculatedSign = getZodiacSignFromDate(storedBirthDate);
      if (calculatedSign) {
        setSelectedSign(calculatedSign);
      }
    }
  }, []);

  const generateHoroscope = async (sign, timeframe) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get birth date from localStorage (for personalization)
      const storedBirthDate = localStorage.getItem('birthDate');
      
      const response = await fetch('/api/generate-horoscope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sign: sign,
          timeframe: timeframe,
          birthDate: storedBirthDate || null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate horoscope');
      }
      
      const data = await response.json();
      setHoroscope(data.horoscope);
      
      // Set personalization info if available
      setPersonalized(data.personalized || false);
      setNatalSun(data.natalSun || null);
      setTransits(data.transits || []);
      
      if (data.personalized) {
        console.log('✨ Personalized horoscope generated!');
        console.log('Natal Sun:', data.natalSun);
        console.log('Active transits:', data.transits);
      }
      
    } catch (err) {
      console.error('Error generating horoscope:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignSelect = (sign) => {
    setSelectedSign(sign);
    generateHoroscope(sign, timeframe);
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    if (selectedSign) {
      generateHoroscope(selectedSign, newTimeframe);
    }
  };

  const calculateBiorhythm = () => {
    if (!birthDate) {
      alert('Please enter your birth date');
      return;
    }

    // Save to localStorage for personalization
    localStorage.setItem('birthDate', birthDate);

    const birth = new Date(birthDate);
    const today = new Date();
    const daysSinceBirth = Math.floor((today - birth) / (1000 * 60 * 60 * 24));

    const physical = Math.sin((2 * Math.PI * daysSinceBirth) / 23) * 100;
    const emotional = Math.sin((2 * Math.PI * daysSinceBirth) / 28) * 100;
    const intellectual = Math.sin((2 * Math.PI * daysSinceBirth) / 33) * 100;

    setBiorhythm({
      physical: physical.toFixed(1),
      emotional: emotional.toFixed(1),
      intellectual: intellectual.toFixed(1),
    });

    // Auto-select the correct zodiac sign based on birthdate
    const calculatedSign = getZodiacSignFromDate(birthDate);
    if (calculatedSign) {
      setSelectedSign(calculatedSign);
      generateHoroscope(calculatedSign, timeframe);
    }
  };

  // Clear birthdate and allow manual sign selection
  const clearBirthDate = () => {
    setBirthDate('');
    localStorage.removeItem('birthDate');
    setBiorhythm(null);
    setPersonalized(false);
    setNatalSun(null);
    setTransits([]);
  };

  const getPhaseDescription = (value) => {
    if (value > 50) return 'High';
    if (value > 0) return 'Rising';
    if (value > -50) return 'Declining';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
            ✨ Cosmic Horoscope ✨
          </h1>
          <p className="text-purple-300 text-lg">
            Discover your cosmic guidance for innovation and success
          </p>
        </header>

        {/* Biorhythm Calculator */}
        <div className="max-w-md mx-auto mb-12 bg-purple-800 bg-opacity-30 rounded-lg p-6 border border-purple-500">
          <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">
            📊 Biorhythm Calculator
          </h2>
          <div className="mb-4">
            <label className="block text-purple-300 text-sm mb-2">
              Enter Your Birth Date:
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-purple-700 text-white border border-purple-500 focus:outline-none focus:border-purple-400"
            />
          </div>
          <button
            onClick={calculateBiorhythm}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Calculate Biorhythm
          </button>

          {biorhythm && (
            <div className="mt-6 space-y-3">
              <div className="bg-red-900 bg-opacity-30 rounded-lg p-3 border border-red-500">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-red-300 font-semibold">Physical</span>
                  <span className="text-red-200 text-sm">{getPhaseDescription(biorhythm.physical)}</span>
                </div>
                <div className="w-full bg-red-900 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.abs(biorhythm.physical)}%` }}
                  ></div>
                </div>
                <p className="text-red-200 text-xs mt-1">{biorhythm.physical}%</p>
              </div>

              <div className="bg-blue-900 bg-opacity-30 rounded-lg p-3 border border-blue-500">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-blue-300 font-semibold">Emotional</span>
                  <span className="text-blue-200 text-sm">{getPhaseDescription(biorhythm.emotional)}</span>
                </div>
                <div className="w-full bg-blue-900 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.abs(biorhythm.emotional)}%` }}
                  ></div>
                </div>
                <p className="text-blue-200 text-xs mt-1">{biorhythm.emotional}%</p>
              </div>

              <div className="bg-green-900 bg-opacity-30 rounded-lg p-3 border border-green-500">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-green-300 font-semibold">Intellectual</span>
                  <span className="text-green-200 text-sm">{getPhaseDescription(biorhythm.intellectual)}</span>
                </div>
                <div className="w-full bg-green-900 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.abs(biorhythm.intellectual)}%` }}
                  ></div>
                </div>
                <p className="text-green-200 text-xs mt-1">{biorhythm.intellectual}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Zodiac Selection */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-purple-300 mb-6 text-center">
            Select Your Zodiac Sign
          </h2>
          
          {/* Show birthdate lock notice if birthdate is set */}
          {birthDate && selectedSign && (
            <div className="bg-yellow-400 bg-opacity-10 rounded-lg p-4 mb-6 border border-yellow-500 border-opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="text-yellow-300 font-semibold text-sm">
                      Your sign: {selectedSign.name} (based on birthdate {formatBirthDate(birthDate)})
                    </p>
                    <p className="text-yellow-200 text-xs mt-1">
                      Other signs are locked for personalized readings. Clear your birthdate to explore other signs.
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearBirthDate}
                  className="px-4 py-2 bg-yellow-500 bg-opacity-20 hover:bg-opacity-30 text-yellow-300 rounded-lg text-sm border border-yellow-500 transition-all"
                >
                  Clear Birthdate
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {zodiacSigns.map((sign) => {
              const isLocked = birthDate && selectedSign && sign.name !== selectedSign.name;
              const isSelected = selectedSign?.name === sign.name;
              
              return (
                <button
                  key={sign.name}
                  onClick={() => !isLocked && handleSignSelect(sign)}
                  disabled={isLocked}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'bg-purple-600 border-purple-400'
                      : isLocked
                      ? 'bg-purple-900 bg-opacity-30 border-purple-800 opacity-40 cursor-not-allowed'
                      : 'bg-purple-800 bg-opacity-50 border-purple-600 hover:border-purple-400 cursor-pointer'
                  }`}
                >
                  <div className="text-4xl mb-2">{sign.symbol}</div>
                  <div className={`font-semibold ${isLocked ? 'text-purple-500' : 'text-purple-200'}`}>
                    {sign.name}
                  </div>
                  <div className={`text-xs ${isLocked ? 'text-purple-600' : 'text-purple-400'}`}>
                    {sign.dates}
                  </div>
                  {isLocked && (
                    <div className="text-xs text-purple-500 mt-1">🔒</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horoscope Display */}
        {selectedSign && (
          <div className="max-w-3xl mx-auto">
            {/* Timeframe Selector */}
            <div className="flex justify-center gap-4 mb-6">
              {['daily', 'weekly', 'monthly'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={`px-6 py-2 rounded-lg capitalize transition-all ${
                    timeframe === tf
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-800 bg-opacity-50 text-purple-300 hover:bg-purple-700'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Personalization Info */}
            {personalized && natalSun && (
              <div className="bg-purple-800 bg-opacity-30 rounded-lg p-4 mb-4 border border-purple-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✨</span>
                  <p className="text-yellow-300 text-sm font-semibold">
                    Personalized Astrology
                  </p>
                </div>
                <p className="text-purple-200 text-xs mb-2">
                  Your natal Sun: <span className="text-yellow-300 font-semibold">{natalSun.exactPosition}</span>
                </p>
                {transits && transits.length > 0 && (
                  <div className="mt-3">
                    <p className="text-purple-300 text-xs font-semibold mb-1">
                      Active transits to your Sun:
                    </p>
                    <div className="space-y-1">
                      {transits.map((transit, i) => (
                        <div key={i} className="text-purple-200 text-xs flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span>{transit.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Horoscope Content */}
            <div className="bg-purple-800 bg-opacity-50 rounded-lg p-6 border border-purple-600">
              <h2 className="text-3xl font-bold text-purple-300 mb-4 capitalize">
                {timeframe} Horoscope
              </h2>
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-purple-600">
                <div className="text-6xl">{selectedSign.symbol}</div>
                <div>
                  <div className="text-2xl font-bold text-purple-200">
                    {selectedSign.name}
                  </div>
                  <div className="text-purple-400">{selectedSign.dates}</div>
                </div>
              </div>

              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin text-6xl mb-4">✨</div>
                  <p className="text-purple-300">Consulting the cosmos...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4">
                  <p className="text-red-300">Error: {error}</p>
                </div>
              )}

              {horoscope && !loading && (
                <div className="text-purple-200 leading-relaxed whitespace-pre-line">
                  {horoscope}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer with SEO Links */}
        <footer className="mt-16 pt-8 border-t border-purple-700">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-purple-300 text-sm mb-4">
              For inventors and entrepreneurs navigating innovation
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a 
                href="https://patentwerks.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Patent Strategy & Filing Services →
              </a>
              <a 
                href="https://ipservices.us" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Comprehensive IP Services →
              </a>
            </div>
            <p className="text-purple-500 text-xs mt-6">
              © 2025 Cosmic Horoscope. Guidance for the innovative spirit.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
