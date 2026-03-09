import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, icon, noPadding = false }) => {
  const { isHolographic } = useTheme();

  return (
    <div className={`
      relative overflow-hidden
      transition-all duration-500 ease-out
      rounded-[24px]
      flex flex-col
      group
      ${isHolographic 
        ? 'bg-gray-900/40 backdrop-blur-xl border border-white/10 border-t-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:shadow-[0_8px_32px_0_rgba(6,182,212,0.15)] hover:border-cyan-500/30 text-slate-200' 
        : 'bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.15)] text-slate-700'
      }
      ${className}
    `}>
      {/* Holographic Effects Layer */}
      {isHolographic && (
        <>
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 -z-10" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </>
      )}

      {(title || icon) && (
        <div className={`flex items-center gap-3 p-6 pb-4 relative z-10 shrink-0 ${isHolographic ? 'border-b border-white/5' : 'border-b border-slate-100'}`}>
          {icon && (
            <div className={`
              p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center
              ${isHolographic 
                ? 'text-cyan-300 bg-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.1)] group-hover:text-cyan-200 group-hover:bg-cyan-400/20'
                : 'text-indigo-600 bg-indigo-50 shadow-sm group-hover:bg-indigo-100 group-hover:scale-110'
              }
            `}>
              {icon}
            </div>
          )}
          {title && (
            <h3 className={`
              text-lg font-bold tracking-tight transition-all duration-300
              ${isHolographic 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]'
                : 'text-slate-800'
              }
            `}>
              {title}
            </h3>
          )}
        </div>
      )}
      
      <div className={`relative z-10 flex-1 min-h-0 ${noPadding ? '' : 'p-6'}`}>
        {children}
      </div>
    </div>
  );
};