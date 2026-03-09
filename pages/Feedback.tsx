import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Smile, Frown, Meh, Angry, Laugh, Star, MapPin, Send, AlertCircle, Loader2, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { auth } from '../services/firebase';
import { dataService } from '../services/data';
import { Sentiment, FeedbackData } from '../types';
import { useTheme } from '../context/ThemeContext';

const categories = ['Product', 'Service', 'Delivery', 'Website', 'Other'];
const aspects = ['Ease of use', 'Quality', 'Customer Service', 'Price'];

export const Feedback: React.FC = () => {
  const { isHolographic } = useTheme();
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [recommend, setRecommend] = useState('Yes');
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [followUp, setFollowUp] = useState(false);
  const [geoAllowed, setGeoAllowed] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [lastSubmission, setLastSubmission] = useState<FeedbackData | null>(null);

  // Fetch location name helper
  const fetchLocationName = async (lat: number, lng: number) => {
    setLocLoading(true);
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await res.json();
      const city = data.city || data.locality;
      const state = data.principalSubdivision;
      const country = data.countryCode || data.countryName;
      
      const parts = [city, state, country].filter(Boolean);
      
      if (parts.length > 0) {
        setLocationName(parts.join(', '));
      } else {
        setLocationName('Location Captured');
      }
    } catch (e) {
      setLocationName('Location Captured');
    } finally {
      setLocLoading(false);
    }
  };

  // Auto-request location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocLoading(true); 
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          setGeoAllowed(true);
          fetchLocationName(loc.lat, loc.lng);
        },
        (error) => {
          console.log("Location access denied or error:", error);
          setLocLoading(false);
        }
      );
    }
  }, []);

  const handleAspectToggle = (aspect: string) => {
    if (selectedAspects.includes(aspect)) {
      setSelectedAspects(selectedAspects.filter(a => a !== aspect));
    } else {
      setSelectedAspects([...selectedAspects, aspect]);
    }
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      setLocLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          setGeoAllowed(true);
          fetchLocationName(loc.lat, loc.lng);
        },
        (error) => {
           console.log(error);
           setLocLoading(false);
        }
      );
    }
  };

  const handleSubmit = async () => {
    setValidationError('');
    
    // Updated Validation: Require EITHER feedback text OR a rating
    if (!feedbackText.trim() && rating === 0) {
      setValidationError("Please provide either a star rating or feedback text.");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await dataService.addFeedback({
        userEmail: auth.currentUser?.email || 'anonymous',
        text: feedbackText,
        rating,
        category: selectedCategory,
        recommend: recommend as 'Yes' | 'No' | 'Maybe',
        followUp,
        location: location || undefined,
        locationName: locationName || undefined,
        timestamp: Date.now()
      });

      setLastSubmission(result);
      setSuccess(true);
      
      // Reset form logic but keep success message for a bit longer to read analysis
      setTimeout(() => {
        setSuccess(false);
        setFeedbackText('');
        setRating(0);
        setSelectedCategory('');
        setSelectedAspects([]);
        setRecommend('Yes');
        setFollowUp(false);
        setValidationError('');
        setLastSubmission(null);
      }, 5000); // Increased timeout to allow reading the sentiment result
    } catch (e) {
      console.error(e);
      setValidationError("Error submitting feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const emojis = [
    { icon: <Angry size={32} />, val: 1, color: isHolographic ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-red-500' },
    { icon: <Frown size={32} />, val: 2, color: isHolographic ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'text-orange-500' },
    { icon: <Meh size={32} />, val: 3, color: isHolographic ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-yellow-500' },
    { icon: <Smile size={32} />, val: 4, color: isHolographic ? 'text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]' : 'text-lime-500' },
    { icon: <Laugh size={32} />, val: 5, color: isHolographic ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'text-green-500' },
  ];

  if (success) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in py-10">
        <GlassCard className={`p-8 md:p-12 text-center animate-pop-in max-w-lg w-full ${lastSubmission?.sentimentMismatch ? 'border-orange-500/30' : 'border-green-500/30'} ${isHolographic ? 'shadow-[0_0_50px_rgba(34,197,94,0.2)]' : 'shadow-2xl'}`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isHolographic ? 'bg-green-500/20 border-green-400/50 shadow-[0_0_30px_rgba(74,222,128,0.4)]' : 'bg-green-100 border-green-200'}`}>
            <Send size={48} className={isHolographic ? "text-green-300" : "text-green-600"} />
          </div>
          <h2 className={`text-4xl font-bold mb-2 ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-200 to-green-400' : 'text-green-600'}`}>Thank You!</h2>
          <p className={`${isHolographic ? 'text-white/70' : 'text-slate-500'} text-lg mb-8`}>Your feedback has been analyzed and stored.</p>
          
          {lastSubmission && (
            <div className={`rounded-2xl p-6 border ${isHolographic ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
               <h3 className={`text-xs uppercase tracking-widest mb-3 font-semibold ${isHolographic ? 'text-white/50' : 'text-slate-400'}`}>AI Analysis Result</h3>
               
               <div className="flex flex-col gap-4">
                  <div className={`flex justify-between items-center p-3 rounded-xl border ${isHolographic ? 'bg-black/20 border-white/5' : 'bg-white border-slate-100'}`}>
                     <span className={`text-sm ${isHolographic ? 'text-white/60' : 'text-slate-500'}`}>Detected Sentiment</span>
                     <span className={`px-3 py-1 rounded-lg font-bold text-sm border
                       ${lastSubmission.sentimentLabel === Sentiment.POSITIVE ? (isHolographic ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-100 text-cyan-700 border-cyan-200') : 
                         lastSubmission.sentimentLabel === Sentiment.NEGATIVE ? (isHolographic ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-200') : 
                         (isHolographic ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200')}`}>
                       {lastSubmission.sentimentLabel}
                     </span>
                  </div>

                  {lastSubmission.sentimentMismatch && (
                    <div className={`flex items-start gap-3 p-3 rounded-xl border text-left ${isHolographic ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                       <AlertTriangle size={24} className="text-orange-400 shrink-0 mt-0.5" />
                       <div>
                          <span className={`block font-bold text-sm mb-1 ${isHolographic ? 'text-orange-200' : 'text-orange-700'}`}>Mismatch Detected</span>
                          <p className={`text-xs leading-relaxed ${isHolographic ? 'text-orange-200/70' : 'text-orange-800/70'}`}>
                             Our AI detected a conflict between your rating ({lastSubmission.rating} stars) and the sentiment of your text. This has been flagged for review.
                          </p>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}
          
          <p className={`text-xs mt-6 ${isHolographic ? 'text-white/30' : 'text-slate-400'}`}>Redirecting to new form in a few seconds...</p>
        </GlassCard>
      </div>
    );
  }

  const labelClass = `block text-lg font-semibold mb-3 tracking-wide uppercase text-xs ${isHolographic ? 'text-cyan-100' : 'text-indigo-600'}`;
  const inputClass = `w-full rounded-2xl p-5 border outline-none transition-all resize-none shadow-inner
    ${isHolographic 
      ? 'bg-black/20 border-white/10 text-white placeholder-white/20 focus:bg-black/40 focus:border-cyan-400/50 focus:shadow-[0_0_25px_rgba(34,211,238,0.15)]' 
      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`;

  return (
    <div className="space-y-6 pb-20 animate-slide-up">
      <div className="flex justify-center mb-6 animate-fade-in">
         <h1 className={`text-4xl font-bold text-center ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-white to-purple-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'text-slate-800'}`}>
           We Value Your Feedback
         </h1>
      </div>

      <GlassCard className={`relative overflow-visible animate-slide-up ${isHolographic ? 'shadow-[0_0_30px_rgba(6,182,212,0.05)]' : ''}`}>
        {/* Rating Section */}
        <div className="mb-8 animate-slide-up delay-100">
          <label className={labelClass}>Please rate your experience</label>
          <div className={`flex items-center justify-between flex-wrap gap-4 p-4 rounded-3xl border shadow-inner ${isHolographic ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex gap-4">
              {emojis.map((e) => (
                <button
                  key={e.val}
                  type="button"
                  onClick={() => { setRating(e.val); if(validationError) setValidationError(''); }}
                  className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 
                    ${rating === e.val 
                      ? (isHolographic ? 'bg-white/10 scale-125 shadow-[0_0_20px_rgba(255,255,255,0.2)] ring-1 ring-white/50' : 'bg-white scale-125 shadow-lg ring-1 ring-slate-200') 
                      : (isHolographic ? 'bg-transparent hover:bg-white/5 grayscale hover:grayscale-0' : 'bg-transparent hover:bg-white grayscale hover:grayscale-0')} 
                    ${rating === e.val ? e.color : (isHolographic ? 'text-white/30' : 'text-slate-300')}`}
                >
                  {e.icon}
                </button>
              ))}
            </div>
            
            <div className={`h-10 w-px hidden sm:block ${isHolographic ? 'bg-white/10' : 'bg-slate-300'}`}></div>

            <div className={`flex items-center gap-2 px-6 py-2 rounded-2xl border shadow-inner ${isHolographic ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} size={24} className={`filter ${isHolographic ? 'drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : ''} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : (isHolographic ? 'text-white/10' : 'text-slate-200')}`} />
                ))}
              </div>
              <span className={`text-2xl font-bold ml-3 tabular-nums ${isHolographic ? 'text-white' : 'text-slate-700'}`}>{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
            </div>
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-8 animate-slide-up delay-200">
          <label className={labelClass}>How can we improve?</label>
          <textarea 
            value={feedbackText}
            onChange={(e) => { setFeedbackText(e.target.value); if(validationError) setValidationError(''); }}
            placeholder="Tell us about your experience..." 
            className={`${inputClass} h-32`}
          />
        </div>

        {/* Grid 1: Category & Key Aspects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="animate-slide-up delay-300">
            <label className={labelClass}>Feedback Category</label>
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all border shadow-sm
                    ${selectedCategory === cat 
                      ? (isHolographic 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                          : 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105')
                      : (isHolographic 
                          ? 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/30'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200')}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="animate-slide-up delay-300">
             <label className={labelClass}>Key Aspects</label>
             <div className="flex flex-wrap gap-3">
              {aspects.map(aspect => (
                <button
                  type="button"
                  key={aspect}
                  onClick={() => handleAspectToggle(aspect)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border
                    ${selectedAspects.includes(aspect) 
                       ? (isHolographic 
                           ? 'bg-purple-500/30 text-white border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                           : 'bg-purple-100 text-purple-700 border-purple-300')
                       : (isHolographic 
                           ? 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                           : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50')}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedAspects.includes(aspect) ? (isHolographic ? 'bg-purple-300 shadow-[0_0_5px_white]' : 'bg-purple-500') : (isHolographic ? 'bg-white/20' : 'bg-slate-300')}`}></div>
                  {aspect}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid 2: Recommend & Actions (Submit) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="animate-slide-up delay-400">
             <label className={labelClass}>Would you recommend us?</label>
             
             {/* Collapsible Dropdown for Recommendation */}
             <div className="relative z-20">
                <button
                  type="button"
                  onClick={() => setRecommendOpen(!recommendOpen)}
                  className={`w-full text-left px-5 py-3 rounded-xl border flex justify-between items-center font-bold shadow-inner transition-all
                    ${isHolographic 
                      ? 'bg-black/20 border-white/10 text-white hover:bg-white/5' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'}
                    ${recommendOpen ? 'rounded-b-none border-b-0' : ''}`}
                >
                   <div className="flex items-center gap-3">
                      {recommend && <div className={`w-2.5 h-2.5 rounded-full ${isHolographic ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-indigo-500'}`}></div>}
                      {recommend}
                   </div>
                   <ChevronDown size={18} className={`transition-transform duration-300 ${isHolographic ? 'text-white/50' : 'text-slate-400'} ${recommendOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {recommendOpen && (
                  <div className={`absolute top-full left-0 w-full border border-t-0 rounded-b-xl overflow-hidden shadow-2xl animate-fade-in backdrop-blur-xl
                    ${isHolographic ? 'bg-[#0a0a14] border-white/10' : 'bg-white border-slate-200'}`}>
                    {['Yes', 'No', 'Maybe'].filter(opt => opt !== recommend).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setRecommend(opt); setRecommendOpen(false); }}
                        className={`w-full text-left px-5 py-3 transition-all flex items-center gap-3
                          ${isHolographic ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      >
                         <div className="w-2.5 h-2.5 rounded-full bg-transparent"></div>
                         {opt}
                      </button>
                    ))}
                  </div>
                )}
             </div>
          </div>

          <div className="animate-slide-up delay-500">
            <div className="flex justify-between items-center mb-3">
              <label className={labelClass}>Can we follow up?</label>
              <button 
                type="button"
                onClick={() => setFollowUp(!followUp)}
                className={`w-14 h-7 rounded-full p-1 transition-all border shadow-inner ${followUp ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-transparent' : (isHolographic ? 'bg-black/40 border-white/10' : 'bg-slate-200 border-slate-300')}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${followUp ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </button>
            </div>
            {followUp && (
              <input 
                type="email" 
                defaultValue={auth.currentUser?.email || ''}
                placeholder="yourname@example.com"
                className={`${inputClass} px-5 py-3 mb-4`}
              />
            )}
            
            <button 
              type="button"
              onClick={requestLocation}
              disabled={locLoading}
              className={`flex items-center gap-2 text-sm transition-all mb-8 px-3 py-1 rounded-lg hover:bg-white/5 
                ${geoAllowed 
                   ? (isHolographic ? 'text-green-400 font-medium drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'text-green-600 font-bold')
                   : (isHolographic ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-600')}`}
            >
              {locLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {locLoading ? 'Locating...' : (locationName ? locationName : (geoAllowed ? 'Location captured' : 'Allow Location Access'))}
            </button>

            {/* Validation Error Message */}
            {validationError && (
              <div className={`mb-4 p-4 rounded-2xl border text-sm animate-fade-in flex items-center gap-3 shadow-sm
                ${isHolographic 
                  ? 'bg-red-500/10 border-red-500/30 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                  : 'bg-red-50 border-red-200 text-red-600'}`}>
                <AlertCircle size={20} className={isHolographic ? "text-red-400" : "text-red-500"} />
                <span>{validationError}</span>
              </div>
            )}

            <button 
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full px-8 py-4 rounded-2xl font-bold tracking-wide transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 relative overflow-hidden group shadow-lg
                ${isHolographic 
                   ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)]'
                   : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/30'}`}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 skew-y-12"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                {submitting ? 'Analyzing...' : 'Submit Feedback'}
              </span>
            </button>
          </div>
        </div>

      </GlassCard>
    </div>
  );
};