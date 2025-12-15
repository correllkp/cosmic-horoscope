// CODE SNIPPET: How to modify your App.jsx to pass birth date to API

// ============================================
// FIND THIS SECTION IN YOUR App.jsx:
// ============================================

// This is where you call the horoscope API
const generateHoroscope = async (sign, timeframe) => {
  setLoading(true);
  setError(null);
  
  try {
    // OLD CODE (what you probably have now):
    const response = await fetch('/api/generate-horoscope', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sign: sign,
        timeframe: timeframe
      }),
    });
    
    // NEW CODE (add birthDate):
    // GET BIRTH DATE FROM LOCALSTORAGE (already there for biorhythm!)
    const birthDate = localStorage.getItem('birthDate');
    
    const response = await fetch('/api/generate-horoscope', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sign: sign,
        timeframe: timeframe,
        birthDate: birthDate || null  // ADD THIS LINE
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate horoscope');
    }
    
    const data = await response.json();
    setHoroscope(data.horoscope);
    
    // OPTIONAL: Store personalization info
    setPersonalized(data.personalized || false);
    setNatalSun(data.natalSun || null);
    setTransits(data.transits || []);
    
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// ============================================
// OPTIONAL: ADD STATE FOR PERSONALIZATION INFO
// ============================================

// At the top of your component with other useState declarations:
const [personalized, setPersonalized] = useState(false);
const [natalSun, setNatalSun] = useState(null);
const [transits, setTransits] = useState([]);

// ============================================
// OPTIONAL: DISPLAY PERSONALIZATION INFO
// ============================================

// Add this BEFORE displaying the horoscope text:

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

// ============================================
// OPTIONAL: PROMPT FOR BIRTH DATE IF MISSING
// ============================================

// Add this ABOVE the zodiac selection:

{!localStorage.getItem('birthDate') && (
  <div className="bg-yellow-400 bg-opacity-10 rounded-lg p-4 mb-6 border border-yellow-500 border-opacity-50">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-2xl">🌟</span>
      <p className="text-yellow-300 font-semibold">
        Get Personalized Predictions
      </p>
    </div>
    <p className="text-yellow-200 text-sm mb-3">
      Enter your birth date below to receive astrology predictions personalized 
      to YOUR birth chart, not just your zodiac sign!
    </p>
    <p className="text-yellow-300 text-xs">
      (Birth date is used for both biorhythm calculations and personalized astrology)
    </p>
  </div>
)}

// ============================================
// COMPLETE EXAMPLE - MODIFIED FETCH CALL
// ============================================

// Here's the complete modified function with all optional features:

const generateHoroscope = async (sign, timeframe) => {
  setLoading(true);
  setError(null);
  
  try {
    // Get birth date from localStorage (already there for biorhythm)
    const birthDate = localStorage.getItem('birthDate');
    
    const response = await fetch('/api/generate-horoscope', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sign: sign,
        timeframe: timeframe,
        birthDate: birthDate || null  // Include if available
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate horoscope');
    }
    
    const data = await response.json();
    
    // Set horoscope text
    setHoroscope(data.horoscope);
    
    // Set personalization info (optional but recommended)
    setPersonalized(data.personalized || false);
    setNatalSun(data.natalSun || null);
    setTransits(data.transits || []);
    
    // Log for debugging
    if (data.personalized) {
      console.log('🌟 Personalized horoscope generated!');
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

// ============================================
// SUMMARY OF CHANGES:
// ============================================

/*
REQUIRED CHANGES (minimum to get personalization working):
1. Add one line to API call: birthDate: localStorage.getItem('birthDate')

OPTIONAL ENHANCEMENTS (highly recommended):
1. Add state variables: personalized, natalSun, transits
2. Display personalization info box (shows natal Sun and transits)
3. Add prompt encouraging users to enter birth date
4. Log personalization status for debugging

THAT'S IT! If user has birth date, they get personalized horoscope.
If not, they get generic zodiac horoscope (backward compatible).
*/
