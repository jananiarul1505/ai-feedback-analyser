import React, { useEffect, useState, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Smile, Meh, Frown, MessageCircle, TrendingUp, AlertCircle, MapPin, Zap, Heart, ThumbsUp, HelpCircle } from 'lucide-react';
import { dataService } from '../services/data';
import { DashboardMetrics, Sentiment } from '../types';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';

// Helper for dynamic emotion icons with extended vocabulary
const getEmotionIcon = (label: string) => {
  const l = label.toLowerCase();
  
  // Positive / High Energy
  if (l.includes('joy') || l.includes('happ') || l.includes('delight') || l.includes('ecsta') || l.includes('elat') || l.includes('euphor')) 
    return <Smile size={24} className="text-green-400" />;
  if (l.includes('love') || l.includes('gratitud') || l.includes('apprecia') || l.includes('admir')) 
    return <Heart size={24} className="text-pink-500" />;
  if (l.includes('approv') || l.includes('satisf') || l.includes('relie')) 
    return <ThumbsUp size={24} className="text-blue-400" />;

  // Negative / High Intensity
  if (l.includes('anger') || l.includes('angry') || l.includes('rage') || l.includes('furi') || l.includes('indigna') || l.includes('hostil')) 
    return <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500 text-red-500 flex items-center justify-center text-[10px]">🤬</div>;
  if (l.includes('disgust') || l.includes('revol') || l.includes('hate')) 
    return <div className="w-6 h-6 rounded-full bg-green-900/10 border border-green-700 text-green-700 flex items-center justify-center text-[10px]">🤢</div>;

  // Negative / Low Intensity
  if (l.includes('sad') || l.includes('sorrow') || l.includes('grief') || l.includes('disapp') || l.includes('melanch')) 
    return <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500 text-blue-500 flex items-center justify-center text-[10px]">😢</div>;
  if (l.includes('fear') || l.includes('anx') || l.includes('nerv') || l.includes('worr') || l.includes('pani')) 
    return <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500 text-purple-500 flex items-center justify-center text-[10px]">😨</div>;
  if (l.includes('frustrat') || l.includes('annoy') || l.includes('irrit')) 
    return <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500 text-orange-500 flex items-center justify-center text-[10px]">😤</div>;

  // Surprise / Confusion
  if (l.includes('surprise') || l.includes('shock') || l.includes('amaze')) 
    return <div className="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500 text-yellow-500 flex items-center justify-center text-[10px]">😲</div>;
  if (l.includes('confus') || l.includes('curio') || l.includes('skeptic') || l.includes('doubt')) 
    return <HelpCircle size={24} className="text-cyan-400" />;

  // Default
  return <Meh size={24} className="text-gray-400" />;
};

export const Dashboard: React.FC = () => {
  const { isHolographic } = useTheme();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Initial load
    setMetrics(dataService.getDashboardMetrics());

    // Subscribe to real-time updates
    const unsubscribe = dataService.subscribe(() => {
      setMetrics(dataService.getDashboardMetrics());
    });

    return () => unsubscribe();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!metrics || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([20, 0], 2);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Update tile layer based on theme
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl = isHolographic 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Add Markers
    metrics.locations.forEach((loc) => {
      const color = loc.sentiment === Sentiment.POSITIVE ? '#06b6d4' : // Cyan/Teal
                    loc.sentiment === Sentiment.NEGATIVE ? '#ec4899' : // Pink
                    '#8b5cf6'; // Purple
      
      L.circleMarker([loc.lat, loc.lng], {
        radius: 6,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8
      }).addTo(map).bindPopup(`
        <div class="text-sm font-sans">
          <strong class="block mb-1 text-black">${loc.name || 'Feedback Location'}</strong>
          <span style="color: ${color}; font-weight: bold">${loc.sentiment}</span>
        </div>
      `);
    });
  }, [metrics, isHolographic]);


  if (!metrics) return <div>Loading...</div>;

  const sentimentData = [
    { name: 'Positive', value: metrics.positiveCount, color: '#06b6d4' }, // Cyan
    { name: 'Neutral', value: metrics.neutralCount, color: '#a78bfa' }, // Purple
    { name: 'Negative', value: metrics.negativeCount, color: '#f472b6' }, // Pink
  ];

  const positivePercentage = metrics.totalFeedbacks > 0 
    ? Math.round((metrics.positiveCount / metrics.totalFeedbacks) * 100) 
    : 0;
  
  // Tag Cloud Helper
  const maxKeywordCount = metrics.topKeywords.length > 0 ? metrics.topKeywords[0].count : 1;

  const chartAxisColor = isHolographic ? '#ffffff60' : '#64748b';
  const chartTooltipBg = isHolographic ? 'rgba(5,5,15,0.9)' : '#ffffff';
  const chartTooltipColor = isHolographic ? '#fff' : '#1e293b';

  return (
    <div className="space-y-6 pb-20 animate-slide-up">
      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-end md:items-center gap-4 rounded-3xl p-6 border animate-fade-in shadow-xl relative overflow-hidden
         ${isHolographic 
           ? 'bg-gradient-to-r from-white/5 via-white/10 to-transparent backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
           : 'bg-white border-white/60 shadow-[0_20px_40px_-10px_rgba(99,102,241,0.1)]'}`}>
        
        <div className={`absolute top-0 left-0 w-2 h-full ${isHolographic ? 'bg-cyan-400 shadow-[0_0_15px_cyan]' : 'bg-indigo-500'}`}></div>
        <div>
          <h2 className={`text-3xl font-bold tracking-tight ${isHolographic ? 'text-white drop-shadow-md' : 'text-slate-800'}`}>Dashboard Overview</h2>
          <p className={`text-sm mt-1 uppercase tracking-wider ${isHolographic ? 'text-cyan-200/60' : 'text-indigo-500/70'}`}>AI BASED FEEDBACK SENTIMENT ANALYSIS V2.0</p>
        </div>
        <div className={`flex gap-3 items-center px-4 py-2 rounded-full border shadow-sm ${isHolographic ? 'bg-black/40 border-cyan-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
           <span className="relative flex h-3 w-3">
             <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHolographic ? 'bg-cyan-400' : 'bg-indigo-500'}`}></span>
             <span className={`relative inline-flex rounded-full h-3 w-3 ${isHolographic ? 'bg-cyan-500' : 'bg-indigo-600'}`}></span>
           </span>
           <span className={`text-xs font-bold uppercase tracking-widest ${isHolographic ? 'text-cyan-100' : 'text-indigo-700'}`}>Live Feed</span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Card */}
        <GlassCard className="relative overflow-hidden group animate-scale-in delay-100 border-l-4 border-l-blue-500" noPadding>
           <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isHolographic ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-100'}`}>
                <MessageCircle size={20} className="text-blue-500" />
              </div>
           </div>
           <div className="p-6">
             <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isHolographic ? 'text-blue-200/60' : 'text-slate-400'}`}>Total Feedbacks</h4>
             <div className={`text-4xl font-bold mb-4 ${isHolographic ? 'text-white' : 'text-slate-800'}`}>{metrics.totalFeedbacks}</div>
             <div className={`w-full h-1.5 rounded-full overflow-hidden ${isHolographic ? 'bg-white/5' : 'bg-slate-100'}`}>
               <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full w-[100%] transition-all duration-1000"></div>
             </div>
           </div>
        </GlassCard>

        {/* Positive Card */}
        <GlassCard className="relative overflow-hidden group animate-scale-in delay-200 border-l-4 border-l-cyan-400" noPadding>
           <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isHolographic ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-100'}`}>
                <TrendingUp size={20} className="text-cyan-500" />
              </div>
           </div>
           <div className="p-6">
             <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isHolographic ? 'text-cyan-200/60' : 'text-slate-400'}`}>Positive</h4>
             <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl font-bold ${isHolographic ? 'text-white' : 'text-slate-800'}`}>{metrics.positiveCount}</span>
                <span className="text-sm font-bold text-cyan-500">{positivePercentage}%</span>
             </div>
             <div className={`w-full h-1.5 rounded-full overflow-hidden ${isHolographic ? 'bg-white/5' : 'bg-slate-100'}`}>
               <div className="bg-gradient-to-r from-cyan-400 to-cyan-200 h-full transition-all duration-1000" style={{ width: `${positivePercentage}%` }}></div>
             </div>
           </div>
        </GlassCard>

        {/* Neutral Card */}
        <GlassCard className="relative overflow-hidden group animate-scale-in delay-300 border-l-4 border-l-purple-500" noPadding>
           <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isHolographic ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-100'}`}>
                <Meh size={20} className="text-purple-500" />
              </div>
           </div>
           <div className="p-6">
             <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isHolographic ? 'text-purple-200/60' : 'text-slate-400'}`}>Neutral</h4>
             <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl font-bold ${isHolographic ? 'text-white' : 'text-slate-800'}`}>{metrics.neutralCount}</span>
                <span className="text-sm font-bold text-purple-500">{metrics.totalFeedbacks > 0 ? Math.round((metrics.neutralCount / metrics.totalFeedbacks) * 100) : 0}%</span>
             </div>
             <div className={`w-full h-1.5 rounded-full overflow-hidden ${isHolographic ? 'bg-white/5' : 'bg-slate-100'}`}>
               <div className="bg-gradient-to-r from-purple-400 to-purple-300 h-full transition-all duration-1000" style={{ width: `${metrics.totalFeedbacks > 0 ? (metrics.neutralCount / metrics.totalFeedbacks) * 100 : 0}%` }}></div>
             </div>
           </div>
        </GlassCard>

        {/* Negative Card */}
        <GlassCard className="relative overflow-hidden group animate-scale-in delay-400 border-l-4 border-l-pink-500" noPadding>
           <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isHolographic ? 'bg-pink-500/10 border border-pink-500/30' : 'bg-pink-50 border border-pink-100'}`}>
                <AlertCircle size={20} className="text-pink-500" />
              </div>
           </div>
           <div className="p-6">
             <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isHolographic ? 'text-pink-200/60' : 'text-slate-400'}`}>Negative</h4>
             <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl font-bold ${isHolographic ? 'text-white' : 'text-slate-800'}`}>{metrics.negativeCount}</span>
                <span className="text-sm font-bold text-pink-500">{metrics.totalFeedbacks > 0 ? Math.round((metrics.negativeCount / metrics.totalFeedbacks) * 100) : 0}%</span>
             </div>
             <div className={`w-full h-1.5 rounded-full overflow-hidden ${isHolographic ? 'bg-white/5' : 'bg-slate-100'}`}>
               <div className="bg-gradient-to-r from-pink-400 to-pink-300 h-full transition-all duration-1000" style={{ width: `${metrics.totalFeedbacks > 0 ? (metrics.negativeCount / metrics.totalFeedbacks) * 100 : 0}%` }}></div>
             </div>
           </div>
        </GlassCard>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sentiment Pie */}
        <GlassCard title="Sentiment Distribution" className="h-[340px] animate-slide-up delay-200">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                innerRadius={70}
                outerRadius={95}
                paddingAngle={6}
                dataKey="value"
                isAnimationActive={true}
                stroke="none"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: isHolographic ? `drop-shadow(0 0 5px ${entry.color})` : 'none' }} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: chartTooltipBg, borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: chartTooltipColor }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
            <span className={`text-4xl font-bold ${isHolographic ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-slate-800'}`}>{positivePercentage}%</span>
            <span className={`text-xs uppercase tracking-widest ${isHolographic ? 'text-cyan-200' : 'text-cyan-600'}`}>Positive</span>
          </div>
        </GlassCard>

        {/* Trend Line */}
        <GlassCard title="Trend Analysis" className="col-span-1 lg:col-span-2 h-[340px] animate-slide-up delay-300">
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={metrics.trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke={chartAxisColor} tick={{ fill: chartAxisColor, fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke={chartAxisColor} tick={{ fill: chartAxisColor, fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip 
                 contentStyle={{ backgroundColor: chartTooltipBg, borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                 itemStyle={{ color: chartTooltipColor }}
              />
              <Line type="monotone" dataKey="pos" stroke="#06b6d4" strokeWidth={3} dot={{r: 4, fill:'#06b6d4', strokeWidth:0}} activeDot={{ r: 6, fill:'#06b6d4' }} strokeDasharray="0" />
              <Line type="monotone" dataKey="neu" stroke="#a78bfa" strokeWidth={3} dot={false} strokeOpacity={0.6} />
              <Line type="monotone" dataKey="neg" stroke="#f472b6" strokeWidth={3} dot={false} strokeOpacity={0.6} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Global Top Keywords - Updated to Tag Cloud */}
        <GlassCard title="Trending Keywords (Top 5)" className="h-full animate-slide-up delay-400">
          <div className="flex flex-wrap gap-4 items-center justify-center p-2 h-full content-center">
             {metrics.topKeywords.length > 0 ? (
               metrics.topKeywords.map((k, i) => {
                 const count = k.count;
                 const ratio = maxKeywordCount > 0 ? count / maxKeywordCount : 0;
                 // Larger base size for Top 5 focus
                 const fontSize = `${1.2 + (ratio * 1.5)}rem`;
                 const opacity = 0.7 + (ratio * 0.3);
                 
                 const colorClass = isHolographic
                   ? (i % 3 === 0 ? 'text-cyan-300' : i % 3 === 1 ? 'text-purple-300' : 'text-pink-300')
                   : (i % 3 === 0 ? 'text-cyan-600' : i % 3 === 1 ? 'text-purple-600' : 'text-pink-600');
                 
                 return (
                   <span 
                    key={i} 
                    className={`font-medium cursor-default transition-all duration-500 hover:scale-110 ${colorClass}`}
                    style={{ 
                      fontSize, 
                      opacity,
                      textShadow: isHolographic && ratio > 0.5 ? `0 0 ${15 * ratio}px currentColor` : 'none'
                    }}
                    title={`${k.text}: ${k.count} mentions`}
                   >
                     {k.text}
                   </span>
                 );
               })
             ) : (
                <span className="text-gray-400 italic">Waiting for feedback...</span>
             )}
          </div>
        </GlassCard>

        {/* Emotion Analysis */}
        <GlassCard title="Sophisticated Emotional Analysis" className="animate-slide-up delay-500">
          <div className="grid grid-cols-2 gap-4">
            {metrics.emotions.length > 0 ? (
              metrics.emotions.slice(0, 4).map((e, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all p-3 rounded-2xl border animate-fade-in
                   ${isHolographic 
                     ? 'bg-white/5 border-white/5 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                     : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`} 
                   style={{ animationDelay: `${400 + (i * 100)}ms` }}>
                  <div className="shrink-0">{getEmotionIcon(e.label)}</div>
                  <div className="min-w-0">
                    <div className={`text-[10px] uppercase tracking-wider truncate ${isHolographic ? 'text-white/40' : 'text-slate-400'}`} title={e.label}>
                      {e.label.split(' ')[0]} {/* Show first word of complex label if space is tight */}
                    </div>
                    <div className={`font-bold text-sm truncate ${isHolographic ? 'text-white' : 'text-slate-800'}`} title={e.label}>
                       {e.label}
                    </div>
                    <div className={`text-xs ${isHolographic ? 'text-white/60' : 'text-slate-500'}`}>{e.percent}%</div>
                  </div>
                </div>
              ))
            ) : (
               <div className="col-span-2 text-center text-gray-400 italic py-4">No emotion data yet</div>
            )}
          </div>
        </GlassCard>

        {/* Aspect Sentiment List */}
        <GlassCard title="Aspect Breakdown" className="animate-slide-up delay-500">
          <div className="space-y-5">
            {metrics.aspectScores.map((a, i) => (
              <div key={i} className="animate-slide-up" style={{ animationDelay: `${500 + (i * 100)}ms` }}>
                 <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-medium ${isHolographic ? 'text-white/80' : 'text-slate-600'}`}>{a.name}</span>
                    <span className={`text-sm font-bold ${a.type === 'Positive' ? 'text-cyan-500' : a.type === 'Neutral' ? 'text-purple-500' : 'text-pink-500'}`}>{a.val}%</span>
                 </div>
                 <div className={`w-full h-1.5 rounded-full overflow-hidden ${isHolographic ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <div 
                      className={`h-full rounded-full ${isHolographic ? 'shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''} ${a.type === 'Positive' ? 'bg-cyan-500' : a.type === 'Neutral' ? 'bg-purple-500' : 'bg-pink-500'}`} 
                      style={{ width: `${a.val}%` }}
                    ></div>
                 </div>
              </div>
            ))}
             {metrics.aspectScores.length === 0 && <div className="text-gray-400 text-sm italic">No data available.</div>}
          </div>
        </GlassCard>

        {/* AI Insights - Liquid Circle */}
        <GlassCard className={`col-span-1 animate-slide-up delay-700 ${isHolographic ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
           <div className="flex items-center gap-6">
             <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className={`w-full h-full transform -rotate-90 ${isHolographic ? 'drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]' : ''}`}>
                  <circle cx="56" cy="56" r="46" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                  <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray="289" strokeDashoffset="23" strokeLinecap="round" className="animate-[spin_4s_linear_infinite]" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                     {metrics.totalFeedbacks > 0 ? '98' : '00'}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-white/80">Uptime</span>
                </div>
             </div>
             <div className="flex-1 space-y-3">
               <h4 className="font-bold text-lg text-white">AI Insights</h4>
               <div className="flex items-start gap-2 text-xs text-white/80">
                 <Zap size={14} className="mt-0.5 shrink-0" />
                 <span>Top Emotion: <strong className="text-white">{metrics.emotions[0]?.label || 'None'}</strong></span>
               </div>
               <div className="flex items-start gap-2 text-xs text-white/80">
                 <Zap size={14} className="mt-0.5 shrink-0" />
                 <span>Dominant Topic: <strong className="text-white">{metrics.topKeywords[0]?.text || 'None'}</strong></span>
               </div>
             </div>
           </div>
        </GlassCard>

        {/* Map */}
        <GlassCard title="Global Sentiment Map" className="col-span-1 lg:col-span-2 relative min-h-[360px] animate-slide-up delay-700" noPadding>
           <div 
             ref={mapContainerRef} 
             className="absolute inset-0 m-0 z-0 bg-[#f8fafc]" 
           ></div>
           
           <div className="absolute top-4 right-4 z-10 flex gap-2">
              <div className={`px-3 py-1 rounded-full border text-xs flex items-center gap-2 backdrop-blur-md ${isHolographic ? 'bg-black/40 border-white/10 text-white' : 'bg-white/80 border-white/40 text-slate-700 shadow-sm'}`}>
                 <div className="w-2 h-2 rounded-full bg-cyan-500"></div> Positive
              </div>
              <div className={`px-3 py-1 rounded-full border text-xs flex items-center gap-2 backdrop-blur-md ${isHolographic ? 'bg-black/40 border-white/10 text-white' : 'bg-white/80 border-white/40 text-slate-700 shadow-sm'}`}>
                 <div className="w-2 h-2 rounded-full bg-pink-500"></div> Negative
              </div>
           </div>
        </GlassCard>

      </div>
    </div>
  );
};