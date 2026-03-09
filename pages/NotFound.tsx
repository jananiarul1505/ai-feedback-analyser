import React from 'react';
import { GlassCard } from '../components/GlassCard';

export const NotFound: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full text-center relative overflow-hidden group animate-scale-in">
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        
        <h1 className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/10 drop-shadow-2xl animate-pulse">404</h1>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent my-4 animate-scale-in delay-200"></div>
        <h2 className="text-3xl font-light mb-2 animate-slide-up delay-300">Page Not Found</h2>
        <p className="text-white/50 text-sm animate-slide-up delay-400">The page you were looking for doesn't exist.</p>
        
        {/* Cracked glass effect visual via CSS borders */}
        <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-white/10 rotate-45 opacity-50"></div>
      </GlassCard>
    </div>
  );
};