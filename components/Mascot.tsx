import React from 'react';
import { AppStatus } from '../types';
import { Sparkles, Zap, Brain, AlertCircle } from 'lucide-react';

interface MascotProps {
  status: AppStatus;
}

const Mascot: React.FC<MascotProps> = ({ status }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`relative w-32 h-32 md:w-48 md:h-48 rounded-full border-4 flex items-center justify-center bg-anime-card transition-all duration-500
        ${status === AppStatus.LOADING ? 'border-anime-pink animate-bounce-slow' : 'border-anime-cyan'}
        ${status === AppStatus.ERROR ? 'border-red-500' : ''}
      `}>
        {/* Simple CSS-based Face/Icon representation since we don't have an actual image asset */}
        {status === AppStatus.IDLE && <Brain className="w-16 h-16 text-anime-cyan" />}
        {status === AppStatus.LOADING && <Zap className="w-16 h-16 text-anime-pink animate-pulse" />}
        {status === AppStatus.SUCCESS && <Sparkles className="w-16 h-16 text-anime-accent" />}
        {status === AppStatus.ERROR && <AlertCircle className="w-16 h-16 text-red-500" />}
        
        {/* Decorators */}
        <div className="absolute -top-2 -right-2 bg-anime-purple text-anime-dark font-anime font-bold px-2 py-1 rounded-full text-xs rotate-12">
            Sensei Mode
        </div>
      </div>
      
      <div className="mt-4 bg-anime-card border-2 border-anime-purple rounded-xl p-3 max-w-xs text-center relative">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-anime-card border-t-2 border-l-2 border-anime-purple rotate-45"></div>
        <p className="text-gray-200 font-anime">
            {status === AppStatus.IDLE && "Ready for your CS questions! Upload them now! 🚀"}
            {status === AppStatus.LOADING && "Analyzing logic gates... Compiling mana... Wait a sec! ⚡"}
            {status === AppStatus.SUCCESS && "Solution compiled! Check the Sensei Corner below! ✨"}
            {status === AppStatus.ERROR && "System Glitch! Try again! 😵‍💫"}
        </p>
      </div>
    </div>
  );
};

export default Mascot;