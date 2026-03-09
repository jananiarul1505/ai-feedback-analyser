import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { Lock, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, logout } from '../services/firebase';
import { dataService } from '../services/data';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const isBanned = auth.currentUser ? dataService.isUserBanned(auth.currentUser.email) : false;

  const handleReturn = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full text-center py-16 animate-scale-in border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-400/50 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-bounce">
           {isBanned ? <Ban size={48} className="text-red-400" /> : <Lock size={48} className="text-red-300" />}
        </div>
        
        <h2 className="text-3xl font-bold mb-2 animate-slide-up delay-200 text-red-200">
          {isBanned ? 'Account Blocked' : 'Access Denied'}
        </h2>
        
        <p className="text-white/60 mb-8 animate-slide-up delay-300 px-6">
          {isBanned 
            ? "Your account has been flagged and blocked by an administrator due to policy violations. You cannot access the system." 
            : "You do not have the required permissions to view this page."}
        </p>

        <button 
          onClick={handleReturn}
          className="px-8 py-3 rounded-full bg-white/5 border border-white/20 hover:bg-white/10 hover:border-red-400/50 transition-all text-sm animate-slide-up delay-400 hover:scale-105 transform font-bold tracking-wide"
        >
          Sign Out & Return
        </button>
      </GlassCard>
    </div>
  );
};