// src/components/PersonalizedOverlay.jsx
// Displays personalized biorhythm-horoscope correlation

import React, { useMemo } from 'react';
import { Zap, Activity, Heart, Brain, AlertTriangle } from 'lucide-react';
import { 
  calculateBiorhythm, 
  generatePersonalizedOverlay, 
  calculateAlignment 
} from '../utils/biorhythm';

export default function PersonalizedOverlay({ horoscope, birthDate, timeframe = 'daily' }) {
  // Calculate biorhythm and overlay
  const biorhythms = useMemo(() => {
    if (!birthDate) return null;
    return calculateBiorhythm(birthDate);
  }, [birthDate]);

  const recommendations = useMemo(() => {
    if (!horoscope || !biorhythms) return null;
    return generatePersonalizedOverlay(horoscope, biorhythms, timeframe);
  }, [horoscope, biorhythms, timeframe]);

  const alignment = useMemo(() => {
    if (!horoscope || !biorhythms) return null;
    return calculateAlignment(horoscope, biorhythms, timeframe);
  }, [horoscope, biorhythms, timeframe]);

  // Don't show if no birth date or no recommendations
  if (!birthDate || !biorhythms || !recommendations || recommendations.length === 0) {
    return null;
  }

  // Get timeframe-specific title
  const getTitle = () => {
    if (timeframe === 'daily') return 'Your Energy Alignment Today';
    if (timeframe === 'weekly') return 'Your Energy Alignment This Week';
    if (timeframe === 'monthly') return 'Your Energy Alignment This Month';
    return 'Your Energy Alignment';
  };

  return (
    <div className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 bg-opacity-20 rounded-2xl p-6 border-2 border-purple-300 border-opacity-30">
      
      {/* Header */}
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Zap className="w-6 h-6 text-yellow-300" />
        {getTitle()}
      </h3>

      {/* Critical Day Warning (if applicable) */}
      {biorhythms.criticalDay && (
        <div className="mb-4 bg-yellow-500 bg-opacity-30 border-2 border-yellow-400 rounded-xl p-4">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-yellow-200 mb-1">Critical Day Alert</h4>
              <p className="text-yellow-100 text-sm">
                One or more of your biorhythm cycles is crossing zero today, making this a transition day. 
                While your horoscope shows opportunities, proceed with extra caution and mindfulness.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-3 mb-4">
        {recommendations.map((rec, i) => (
          <div 
            key={i}
            className={`flex gap-3 p-3 rounded-xl border ${
              rec.color === 'green' ? 'bg-green-500 bg-opacity-20 border-green-300 border-opacity-40' :
              rec.color === 'blue' ? 'bg-blue-500 bg-opacity-20 border-blue-300 border-opacity-40' :
              rec.color === 'yellow' ? 'bg-yellow-500 bg-opacity-20 border-yellow-300 border-opacity-40' :
              'bg-red-500 bg-opacity-20 border-red-300 border-opacity-40'
            }`}
          >
            <span className={`text-xl flex-shrink-0 ${
              rec.color === 'green' ? 'text-green-300' :
              rec.color === 'blue' ? 'text-blue-300' :
              rec.color === 'yellow' ? 'text-yellow-300' :
              'text-red-300'
            }`}>
              {rec.icon}
            </span>
            <p className="text-white text-sm leading-relaxed">{rec.message}</p>
          </div>
        ))}
      </div>

      {/* Energy Summary Bar */}
      <div className="pt-4 border-t border-white border-opacity-20">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-4 h-4 text-red-300" />
              <span className="text-xs font-semibold text-red-300">Physical</span>
            </div>
            <div className="text-lg font-bold text-white">{biorhythms.physical.toFixed(0)}%</div>
            <div className="text-xs text-red-200">{biorhythms.physicalStatus}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Heart className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-semibold text-blue-300">Emotional</span>
            </div>
            <div className="text-lg font-bold text-white">{biorhythms.emotional.toFixed(0)}%</div>
            <div className="text-xs text-blue-200">{biorhythms.emotionalStatus}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Brain className="w-4 h-4 text-purple-300" />
              <span className="text-xs font-semibold text-purple-300">Mental</span>
            </div>
            <div className="text-lg font-bold text-white">{biorhythms.intellectual.toFixed(0)}%</div>
            <div className="text-xs text-purple-200">{biorhythms.intellectualStatus}</div>
          </div>
        </div>

        {/* Alignment Score */}
        {alignment && (
          <div className="bg-white bg-opacity-10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Cosmic-Energy Alignment:</span>
              <span className="text-xl font-bold text-white">{alignment.score}%</span>
            </div>
            <div className="h-2 bg-black bg-opacity-30 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                style={{ width: `${alignment.score}%` }}
              />
            </div>
            <p className="text-purple-100 text-xs">{alignment.message}</p>
          </div>
        )}
      </div>

    </div>
  );
}
