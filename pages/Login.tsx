import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithEmailAndPassword, createUserWithEmailAndPassword, auth } from '../services/firebase';
import { GlassCard } from '../components/GlassCard';
import { Lock, Mail, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isHolographic } = useTheme();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const validatePassword = (pass: string) => {
    // Mandatory 8+ chars, mixed letters and numbers
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(pass);
  };

  const handleEmailAuth = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isSignUp && !validatePassword(password)) {
      setError('Password must be at least 8 characters and contain both letters and numbers.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/feedback');
    } catch (err: any) {
      console.error(err);
      if (err.message) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/feedback');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError('Access Denied: Unauthorized account or network error.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full pl-11 pr-4 py-3.5 rounded-xl outline-none transition-all
    ${isHolographic 
      ? 'bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:bg-black/50 focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
      : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in relative z-10 overflow-hidden">
      {/* Background Ambience for Login - Only in Holo mode */}
      {isHolographic && (
        <>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </>
      )}

      <GlassCard className={`w-full max-w-md !p-0 !overflow-visible animate-scale-in z-20 ${isHolographic ? 'shadow-[0_0_60px_rgba(0,0,0,0.5)] border-cyan-500/20' : 'shadow-2xl border-white/50 bg-white/90'}`}>
        <div className="p-10 relative z-20">
          <div className="flex flex-col items-center mb-10 animate-slide-up text-center">
            <h2 className={`text-3xl font-bold mb-2 ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-purple-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-slate-800'}`}>
              AI Feedback Intelligence
            </h2>
            <div className={`h-1 w-20 rounded-full mb-4 ${isHolographic ? 'bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_10px_cyan]' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}></div>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isHolographic ? 'text-slate-400' : 'text-slate-500'}`}>
              {isSignUp ? 'Create Account' : 'Secure Login'}
            </p>
          </div>

          <div className="space-y-5">
            {/* Email Input */}
            <div className="relative group animate-slide-up delay-100">
              <label className="text-[10px] text-slate-400 ml-1 mb-1.5 block uppercase tracking-widest font-bold">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className={`${isHolographic ? 'text-cyan-400/70' : 'text-indigo-500'}`} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative animate-slide-up delay-200">
              <label className="text-[10px] text-slate-400 ml-1 mb-1.5 block uppercase tracking-widest font-bold">
                Password {isSignUp && <span className="text-slate-500 lowercase font-normal">(8+ chars)</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className={`${isHolographic ? 'text-cyan-400/70' : 'text-indigo-500'}`} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className={`flex items-start gap-3 text-sm p-4 rounded-xl border animate-fade-in ${isHolographic ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
                <AlertCircle size={18} className={isHolographic ? "text-red-400" : "text-red-500"} />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4 animate-slide-up delay-300 space-y-4">
              {/* Primary Action Button */}
              <button 
                type="button"
                onClick={handleEmailAuth}
                disabled={loading}
                className={`w-full py-4 px-4 rounded-xl font-bold tracking-wide transition-all duration-300 border relative overflow-hidden group
                  ${isHolographic 
                    ? 'border-white/20 bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:-translate-y-0.5' 
                    : 'border-transparent bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/30'
                  }
                `}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Processing...' : (isSignUp ? <><UserPlus size={18}/> Create Account</> : <><LogIn size={18}/> Sign In</>)}
                </span>
              </button>
              
              <div className="relative flex py-2 items-center">
                <div className={`flex-grow border-t ${isHolographic ? 'border-white/10' : 'border-slate-200'}`}></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] uppercase font-bold tracking-widest">Or Continue With</span>
                <div className={`flex-grow border-t ${isHolographic ? 'border-white/10' : 'border-slate-200'}`}></div>
              </div>

              {/* Google Button */}
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold tracking-wide border transition-all flex items-center justify-center gap-2
                   ${isHolographic 
                     ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/30' 
                     : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
                   }
                `}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>

              {/* Toggle Login/Signup */}
              <div className="text-center pt-2">
                <button 
                   onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                   className={`text-sm transition-colors ${isHolographic ? 'text-cyan-400 hover:text-cyan-300' : 'text-indigo-600 hover:text-indigo-500'}`}
                >
                   {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};