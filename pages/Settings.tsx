import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { User, Lock, ToggleRight, ToggleLeft, Save, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth, updateProfile, updateEmail, updatePassword } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';

export const Settings: React.FC = () => {
  const { isHolographic, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(auth.currentUser?.photoURL || null);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || '');
      setEmail(auth.currentUser.email || '');
      setPreviewImage(auth.currentUser.photoURL);
    }
  }, [auth.currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    setMessage(null);
    setProfileLoading(true);
    try {
      if (auth.currentUser) {
        // Update Name and Photo
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL: previewImage || undefined
        });

        // Update Email if changed
        if (email !== auth.currentUser.email) {
          await updateEmail(auth.currentUser, email);
        }

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setMessage(null);
    if (newPassword.length < 8) {
       setMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
       return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPassLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setMessage({ type: 'success', text: 'Saved successfully.' });
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to update password' });
    } finally {
      setPassLoading(false);
    }
  };

  const inputClass = `w-full rounded-xl p-3 outline-none transition-all
    ${isHolographic 
      ? 'bg-black/20 border border-white/10 text-white placeholder-white/40 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
      : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`;

  return (
    <div className="space-y-8 animate-slide-up pb-20">
       <div className="flex justify-center mb-2 animate-fade-in">
         <h1 className={`text-3xl font-bold text-center ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200 drop-shadow-sm' : 'text-slate-800'}`}>
           Settings
         </h1>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl border animate-fade-in ${message.type === 'success' ? (isHolographic ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isHolographic ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Update */}
        <GlassCard className={`col-span-1 md:col-span-2 animate-slide-up delay-100 ${isHolographic ? 'border-l-4 border-l-blue-500' : ''}`}>
          <h3 className={`text-lg font-semibold mb-6 ${isHolographic ? 'text-blue-200' : 'text-slate-700'}`}>Profile Update</h3>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
               <div className={`relative w-32 h-32 rounded-full p-1 ${isHolographic ? 'bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg'}`}>
                 <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden border border-white/20 relative group ${isHolographic ? 'bg-black/40 backdrop-blur-md' : 'bg-white'}`}>
                    {previewImage ? (
                      <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className={isHolographic ? "text-white/50" : "text-slate-300"} />
                    )}
                    
                    {/* Overlay on hover */}
                    <div 
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={24} className="text-white" />
                    </div>
                 </div>
               </div>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 className="hidden" 
                 accept="image/*"
               />
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className={`text-xs uppercase tracking-widest font-bold transition-colors ${isHolographic ? 'text-cyan-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}
               >
                 Change Photo
               </button>
            </div>

            {/* Inputs Section */}
            <div className="flex-1 space-y-4">
              <div>
                <label className={`text-xs uppercase mb-1 block ml-1 ${isHolographic ? 'text-white/50' : 'text-slate-400'}`}>Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass} 
                />
              </div>
              <div>
                <label className={`text-xs uppercase mb-1 block ml-1 ${isHolographic ? 'text-white/50' : 'text-slate-400'}`}>Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass} 
                />
              </div>

              <button 
                onClick={handleProfileUpdate}
                disabled={profileLoading}
                className={`w-full py-3 rounded-xl text-white font-bold mt-2 transition-all border border-white/20 transform hover:-translate-y-1 flex items-center justify-center gap-2 
                   ${isHolographic 
                     ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]' 
                     : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
              >
                {profileLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Save Profile
              </button>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-6">
          {/* Password Change */}
          <GlassCard className={`animate-slide-up delay-200 ${isHolographic ? 'border-l-4 border-l-pink-500' : ''}`}>
             <h3 className={`text-lg font-semibold mb-6 ${isHolographic ? 'text-pink-200' : 'text-slate-700'}`}>Password Change</h3>
             <div className="space-y-4">
               <div className="relative">
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (8+ chars)" 
                    className={`${inputClass} pr-10`}
                  />
                  <Lock size={16} className={`absolute right-3 top-3.5 ${isHolographic ? 'text-white/40' : 'text-slate-400'}`} />
               </div>
               <div className="relative">
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password" 
                    className={`${inputClass} pr-10`}
                  />
               </div>
               <button 
                 onClick={handlePasswordUpdate}
                 disabled={passLoading}
                 className={`w-full py-3 rounded-xl text-white font-bold mt-4 transition-all border border-white/20 transform hover:-translate-y-1 flex items-center justify-center gap-2 
                    ${isHolographic 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]' 
                      : 'bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-200'}`}
               >
                 {passLoading ? <Loader2 className="animate-spin" size={20}/> : 'Update Password'}
               </button>
             </div>
          </GlassCard>

          {/* Appearance */}
          <GlassCard className={`flex flex-col animate-slide-up delay-300 ${isHolographic ? 'border-l-4 border-l-purple-500' : ''}`}>
             <h3 className={`text-lg font-semibold mb-6 ${isHolographic ? 'text-purple-200' : 'text-slate-700'}`}>Appearance</h3>
             
             <div className={`flex items-center justify-between p-4 rounded-xl border shadow-inner ${isHolographic ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <span className={isHolographic ? 'text-white/80' : 'text-slate-700 font-medium'}>Holographic Mode</span>
                <button onClick={toggleTheme} className="focus:outline-none">
                  {isHolographic ? (
                    <ToggleRight size={48} className="text-cyan-400 cursor-pointer drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  ) : (
                    <ToggleLeft size={48} className="text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors" />
                  )}
                </button>
             </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};