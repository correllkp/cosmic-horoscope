// src/utils/biorhythm.js
// Biorhythm calculation utilities - Pure math, no API calls

/**
 * Calculate biorhythm cycles based on birth date
 * @param {string} birthDate - Date string in YYYY-MM-DD format
 * @param {Date} targetDate - Optional target date (defaults to today)
 * @returns {Object} Biorhythm data
 */
export const calculateBiorhythm = (birthDate, targetDate = new Date()) => {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const target = new Date(targetDate);
  const daysSinceBirth = Math.floor((target - birth) / (1000 * 60 * 60 * 24));

  if (daysSinceBirth < 0) return null;

  // Biorhythm cycle lengths (in days)
  const PHYSICAL = 23;
  const EMOTIONAL = 28;
  const INTELLECTUAL = 33;

  // Calculate sine wave values (-1 to 1, then convert to percentage)
  const physical = Math.sin((2 * Math.PI * daysSinceBirth) / PHYSICAL) * 100;
  const emotional = Math.sin((2 * Math.PI * daysSinceBirth) / EMOTIONAL) * 100;
  const intellectual = Math.sin((2 * Math.PI * daysSinceBirth) / INTELLECTUAL) * 100;

  // Determine status for each cycle
  const getStatus = (value) => {
    const abs = Math.abs(value);
    if (abs < 15) return 'Critical';
    if (value > 70) return 'Peak';
    if (value > 40) return 'High';
    if (value > 15) return 'Rising';
    if (value > -15) return 'Declining';
    if (value > -40) return 'Low';
    return 'Very Low';
  };

  // Check if any cycle is in critical phase (crossing zero)
  const criticalDay = Math.abs(physical) < 15 || 
                      Math.abs(emotional) < 15 || 
                      Math.abs(intellectual) < 15;

  return {
    physical,
    emotional,
    intellectual,
    physicalStatus: getStatus(physical),
    emotionalStatus: getStatus(emotional),
    intellectualStatus: getStatus(intellectual),
    criticalDay,
    daysSinceBirth
  };
};

/**
 * Analyze horoscope text for themes/keywords
 * @param {string} horoscopeText - The horoscope content
 * @returns {Array} Array of detected themes with biorhythm dependencies
 */
export const analyzeHoroscope = (horoscopeText) => {
  const text = horoscopeText.toLowerCase();
  
  const themes = {
    action: {
      keywords: ['action', 'move', 'push', 'initiate', 'start', 'begin', 'launch', 'execute', 'implement'],
      detected: false,
      biorhythmDependency: 'physical',
      displayName: 'Action & Movement'
    },
    decisions: {
      keywords: ['decision', 'choose', 'select', 'determine', 'judge', 'analyze', 'strategy', 'plan', 'evaluate'],
      detected: false,
      biorhythmDependency: 'intellectual',
      displayName: 'Strategic Decisions'
    },
    relationships: {
      keywords: ['relationship', 'partner', 'collaborate', 'connect', 'communicate', 'team', 'cooperation'],
      detected: false,
      biorhythmDependency: 'emotional',
      displayName: 'Relationships & Collaboration'
    },
    creativity: {
      keywords: ['creative', 'art', 'express', 'innovate', 'imagine', 'design', 'invention'],
      detected: false,
      biorhythmDependency: 'emotional',
      displayName: 'Creative Expression'
    },
    physical: {
      keywords: ['energy', 'stamina', 'exercise', 'physical', 'body', 'health', 'vigor', 'strength'],
      detected: false,
      biorhythmDependency: 'physical',
      displayName: 'Physical Activities'
    },
    learning: {
      keywords: ['learn', 'study', 'understand', 'knowledge', 'research', 'intellectual', 'mental'],
      detected: false,
      biorhythmDependency: 'intellectual',
      displayName: 'Learning & Analysis'
    }
  };
  
  // Detect which themes are present
  Object.keys(themes).forEach(themeKey => {
    const matched = themes[themeKey].keywords.some(keyword => text.includes(keyword));
    themes[themeKey].detected = matched;
  });
  
  // Return only detected themes
  return Object.entries(themes)
    .filter(([_, data]) => data.detected)
    .map(([name, data]) => ({
      name,
      displayName: data.displayName,
      biorhythmDependency: data.biorhythmDependency
    }));
};

/**
 * Generate personalized recommendations based on horoscope and biorhythm alignment
 * @param {string} horoscope - The horoscope text
 * @param {Object} biorhythms - Biorhythm data from calculateBiorhythm
 * @returns {Array} Array of recommendation objects
 */
export const generatePersonalizedOverlay = (horoscope, biorhythms) => {
  const themes = analyzeHoroscope(horoscope);
  
  if (themes.length === 0 || !biorhythms) {
    return null;
  }
  
  const recommendations = [];
  
  themes.forEach(theme => {
    let bioValue;
    let bioName;
    let emoji;
    
    if (theme.biorhythmDependency === 'physical') {
      bioValue = biorhythms.physical;
      bioName = 'Physical energy';
      emoji = '⚡';
    } else if (theme.biorhythmDependency === 'emotional') {
      bioValue = biorhythms.emotional;
      bioName = 'Emotional energy';
      emoji = '❤️';
    } else {
      bioValue = biorhythms.intellectual;
      bioName = 'Mental clarity';
      emoji = '🧠';
    }
    
    // Determine recommendation type and message
    let type, message, icon, color;
    
    if (Math.abs(bioValue) < 15) {
      // Critical day for this cycle
      type = 'critical';
      icon = '⚠️';
      color = 'yellow';
      message = `${emoji} ${bioName} is CRITICAL (${bioValue.toFixed(0)}% - crossing zero). Your horoscope mentions ${theme.displayName.toLowerCase()}, but this is a transition day. Proceed with extra caution or postpone 1-2 days.`;
    } else if (bioValue > 60) {
      // Excellent alignment
      type = 'excellent';
      icon = '✓';
      color = 'green';
      message = `${emoji} ${bioName} is high (${bioValue.toFixed(0)}%) - perfect alignment with the ${theme.displayName.toLowerCase()} your horoscope highlights!`;
    } else if (bioValue > 20) {
      // Good alignment
      type = 'good';
      icon = '~';
      color = 'blue';
      message = `${emoji} ${bioName} is moderate (${bioValue.toFixed(0)}%). You can engage with ${theme.displayName.toLowerCase()}, just pace yourself and take breaks.`;
    } else if (bioValue > -20) {
      // Declining - caution advised
      type = 'caution';
      icon = '!';
      color = 'yellow';
      message = `${emoji} ${bioName} is declining (${bioValue.toFixed(0)}%). Your horoscope mentions ${theme.displayName.toLowerCase()}, but consider lighter engagement or postponing to tomorrow when energy rises.`;
    } else {
      // Low energy - avoid
      type = 'avoid';
      icon = '✗';
      color = 'red';
      message = `${emoji} ${bioName} is low (${bioValue.toFixed(0)}%). While your horoscope highlights ${theme.displayName.toLowerCase()}, your energy suggests avoiding demanding activities in this area today.`;
    }
    
    recommendations.push({
      type,
      theme: theme.name,
      displayName: theme.displayName,
      message,
      icon,
      color,
      bioValue
    });
  });
  
  return recommendations;
};

/**
 * Calculate overall alignment score between horoscope and biorhythm
 * @param {string} horoscope - The horoscope text
 * @param {Object} biorhythms - Biorhythm data
 * @returns {Object} Alignment score and message
 */
export const calculateAlignment = (horoscope, biorhythms) => {
  const themes = analyzeHoroscope(horoscope);
  
  if (themes.length === 0 || !biorhythms) {
    return { score: 50, message: "Unable to calculate alignment" };
  }
  
  let totalAlignment = 0;
  
  themes.forEach(theme => {
    const bioValue = biorhythms[theme.biorhythmDependency];
    
    // Score based on biorhythm value
    if (Math.abs(bioValue) < 15) {
      totalAlignment += 10; // Critical - very low alignment
    } else if (bioValue > 60) {
      totalAlignment += 90; // Excellent
    } else if (bioValue > 20) {
      totalAlignment += 60; // Good
    } else if (bioValue > -20) {
      totalAlignment += 30; // Declining
    } else {
      totalAlignment += 10; // Low
    }
  });
  
  const score = Math.round(totalAlignment / themes.length);
  
  let message;
  if (score > 75) {
    message = "Excellent alignment! Your cosmic forecast and personal energy cycles are working together beautifully.";
  } else if (score > 50) {
    message = "Good alignment. Some cosmic opportunities may benefit from strategic timing based on your energy cycles.";
  } else if (score > 30) {
    message = "Moderate alignment. Your horoscope shows opportunities, but current energy suggests patience and careful planning.";
  } else {
    message = "Low alignment today. Consider this a planning and preparation day - your energy will support action later this week.";
  }
  
  return { score, message };
};

/**
 * Calculate zodiac sign from birth date
 * @param {string} birthDate - Date string in YYYY-MM-DD format
 * @returns {Object} Zodiac sign data
 */
export const calculateZodiacSign = (birthDate) => {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const signs = [
    { name: 'Capricorn', dates: 'Dec 22 - Jan 19', element: 'Earth', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', dates: 'Jan 20 - Feb 18', element: 'Air', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', dates: 'Feb 19 - Mar 20', element: 'Water', start: [2, 19], end: [3, 20] },
    { name: 'Aries', dates: 'Mar 21 - Apr 19', element: 'Fire', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', dates: 'Apr 20 - May 20', element: 'Earth', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', dates: 'May 21 - Jun 20', element: 'Air', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', dates: 'Jun 21 - Jul 22', element: 'Water', start: [6, 21], end: [7, 22] },
    { name: 'Leo', dates: 'Jul 23 - Aug 22', element: 'Fire', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', dates: 'Aug 23 - Sep 22', element: 'Earth', start: [8, 23], end: [9, 22] },
    { name: 'Libra', dates: 'Sep 23 - Oct 22', element: 'Air', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', dates: 'Oct 23 - Nov 21', element: 'Water', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', dates: 'Nov 22 - Dec 21', element: 'Fire', start: [11, 22], end: [12, 21] },
  ];
  
  for (const sign of signs) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;
    
    if (month === startMonth && day >= startDay) return sign;
    if (month === endMonth && day <= endDay) return sign;
  }
  
  return signs[0]; // Default to Capricorn
};
