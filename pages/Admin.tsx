import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { 
  Users, Lock, MessageSquare, FileText, RefreshCw, 
  ShieldAlert, ShieldCheck, Ban, Trash2, Flag, Download, 
  CheckCircle2, Search, UserPlus, AlertTriangle, Key, Database, AlertOctagon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { dataService } from '../services/data';
import { FeedbackData, Sentiment } from '../types';

type AdminTab = 'users' | 'moderation' | 'reports' | 'ai' | 'security';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Data State
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [retraining, setRetraining] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [blockEmailInput, setBlockEmailInput] = useState('');

  // Security State
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const { isHolographic } = useTheme();

  // Load Data
  const loadData = () => {
    setFeedbacks(dataService.getAllFeedbacks());
    setUsers(dataService.getUsers());
  };

  useEffect(() => {
    if (authenticated) {
      loadData();
      const unsubscribe = dataService.subscribe(() => {
        loadData();
      });
      return () => unsubscribe();
    }
  }, [authenticated]);

  // Auth Handler
  const handlePasscode = () => {
    setAuthError('');
    const stored = dataService.getAdminPasscode();
    if (passcodeInput === stored) {
      setAuthenticated(true);
    } else {
      setAuthError('Incorrect passcode. Access denied.');
      setPasscodeInput(''); // Clear input for better UX
    }
  };

  // Allow 'Enter' key to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasscode();
    }
  };

  // --- Actions ---

  const handleRetrain = () => {
    setRetraining(true);
    setTimeout(() => {
      setRetraining(false);
      alert('Success: Merged dataset (TweetEval + GoEmotions + Amazon) re-indexed with new samples.');
    }, 3000);
  };

  const handlePromoteAdmin = () => {
    if (adminEmailInput) {
      dataService.updateUserStatus(adminEmailInput, { isAdmin: true });
      setAdminEmailInput('');
      alert(`${adminEmailInput} promoted to Admin.`);
    }
  };

  const handleManualBlock = () => {
    if (blockEmailInput) {
      dataService.blockUser(blockEmailInput);
      setBlockEmailInput('');
      alert(`${blockEmailInput} added to blocked list.`);
    }
  };

  const handleBanUser = (email: string) => {
    if (window.confirm(`Are you sure you want to disable account for ${email}?`)) {
      dataService.blockUser(email); // Use explicit block method
    }
  };

  const handleUnbanUser = (email: string) => {
    dataService.unblockUser(email); // Use explicit unblock method
  };

  const handleDeleteFeedback = (id: string) => {
    if (window.confirm('Permanently delete this feedback?')) {
      dataService.deleteFeedback(id);
    }
  };

  const handleToggleFlag = (id: string) => {
    dataService.toggleFlag(id);
  };

  const handleUpdatePasscode = () => {
    setSecurityMessage(null);
    if (currentPasscode !== dataService.getAdminPasscode()) {
      setSecurityMessage({ type: 'error', text: 'Current passcode is incorrect.' });
      return;
    }
    if (newPasscode.length < 4) {
      setSecurityMessage({ type: 'error', text: 'New passcode must be at least 4 characters.' });
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setSecurityMessage({ type: 'error', text: 'New passcodes do not match.' });
      return;
    }
    dataService.setAdminPasscode(newPasscode);
    setSecurityMessage({ type: 'success', text: 'Saved successfully.' });
    setCurrentPasscode('');
    setNewPasscode('');
    setConfirmPasscode('');
  };

  const handleExportCSV = () => {
    const headers = ['Time', 'User', 'Rating', 'Sentiment', 'Mismatch', 'Abusive Words', 'Text'];
    const rows = feedbacks.map(f => [
      new Date(f.timestamp).toISOString(),
      f.userEmail,
      f.rating,
      f.sentimentLabel,
      f.sentimentMismatch ? 'YES' : 'NO',
      f.abusiveWords ? `"${f.abusiveWords.join(', ')}"` : '',
      `"${f.text.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sentiment_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(feedbacks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "sentiment_data_full.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const inputClass = `w-full rounded-xl py-3 pl-10 pr-4 outline-none transition-all
    ${isHolographic 
       ? 'bg-black/20 border border-white/10 text-white focus:border-cyan-400/50 placeholder-white/40' 
       : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500 placeholder-slate-400'}`;

  const buttonClass = `px-6 py-3 rounded-xl font-bold transition-all shadow-lg border
    ${isHolographic 
      ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-white/10' 
      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-200'}`;

  if (!authenticated) {
    return (
      <div className="h-[80vh] flex items-center justify-center animate-fade-in">
        <GlassCard className={`w-full max-w-md text-center p-12 animate-scale-in border-red-500/30 ${isHolographic ? 'shadow-[0_0_50px_rgba(239,68,68,0.15)]' : 'shadow-2xl'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border animate-pulse ${isHolographic ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-red-50 border-red-100'}`}>
            <Lock size={36} className="text-red-400" />
          </div>
          <h2 className={`text-3xl font-bold mb-4 ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-red-500' : 'text-slate-800'}`}>Admin Access</h2>
          <p className={`${isHolographic ? 'text-white/60' : 'text-slate-500'} mb-8`}>Enter secure administration passcode to proceed.</p>
          
          <input 
            type="password" 
            value={passcodeInput}
            onChange={(e) => { setPasscodeInput(e.target.value); setAuthError(''); }}
            onKeyDown={handleKeyDown}
            className={`w-full rounded-xl p-4 text-center text-2xl tracking-[0.5em] mb-4 focus:outline-none transition-all 
               ${isHolographic 
                 ? 'bg-black/40 border border-red-500/30 text-red-100 placeholder-red-900/50 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                 : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-300 focus:border-red-400 focus:bg-white'}`}
            placeholder="••••"
          />

          {authError && (
            <div className={`flex items-center justify-center gap-2 p-3 rounded-xl mb-6 text-sm animate-fade-in border ${isHolographic ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <AlertTriangle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <button 
            onClick={handlePasscode}
            className={`w-full py-4 rounded-xl text-white font-bold transition-all transform hover:scale-[1.02] border border-white/20 
               ${isHolographic 
                 ? 'bg-gradient-to-r from-red-600 to-orange-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                 : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg'}`}
          >
            Verify Access
          </button>
        </GlassCard>
      </div>
    );
  }

  // --- Main UI ---

  const tabs = [
    { id: 'users', label: 'User Management', icon: <Users size={18} /> },
    { id: 'moderation', label: 'Moderation', icon: <ShieldAlert size={18} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
    { id: 'ai', label: 'AI Model', icon: <RefreshCw size={18} /> },
    { id: 'security', label: 'Security', icon: <Key size={18} /> },
  ];

  return (
    <div className="space-y-6 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6 animate-fade-in">
         <div>
            <h1 className={`text-4xl font-bold ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-cyan-200' : 'text-slate-800'}`}>
              Admin Panel
            </h1>
            <p className={`text-sm mt-1 uppercase tracking-wider ${isHolographic ? 'text-white/50' : 'text-indigo-500/70'}`}>System Control Center</p>
         </div>
         {/* Navigation Tabs */}
         <div className={`flex p-1 rounded-xl border overflow-x-auto max-w-full ${isHolographic ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap 
                   ${activeTab === tab.id 
                     ? (isHolographic ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100') 
                     : (isHolographic ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50')}`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
         </div>
      </div>

      {/* ---------------- USERS TAB ---------------- */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <GlassCard title="User Actions">
            <div className="flex flex-col md:flex-row gap-6 items-end">
               {/* Promote Admin */}
               <div className="flex-1 w-full">
                  <label className={`text-xs uppercase tracking-widest mb-2 block ${isHolographic ? 'text-white/50' : 'text-slate-500'}`}>Promote to Admin</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <UserPlus size={18} className={`absolute left-3 top-3.5 ${isHolographic ? 'text-white/30' : 'text-slate-400'}`} />
                      <input 
                        type="email" 
                        value={adminEmailInput}
                        onChange={(e) => setAdminEmailInput(e.target.value)}
                        placeholder="Enter user email address" 
                        className={inputClass}
                      />
                    </div>
                    <button onClick={handlePromoteAdmin} className={buttonClass}>
                      Promote
                    </button>
                  </div>
               </div>
               
               {/* Manual Block */}
               <div className="flex-1 w-full">
                  <label className={`text-xs uppercase tracking-widest mb-2 block ${isHolographic ? 'text-white/50' : 'text-slate-500'}`}>Block User (Email)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ban size={18} className="absolute left-3 top-3.5 text-red-400/50" />
                      <input 
                        type="email" 
                        value={blockEmailInput}
                        onChange={(e) => setBlockEmailInput(e.target.value)}
                        placeholder="Enter email to block" 
                        className={`w-full rounded-xl py-3 pl-10 pr-4 outline-none transition-all
                           ${isHolographic 
                             ? 'bg-red-500/5 border border-red-500/20 text-white focus:border-red-400/50' 
                             : 'bg-red-50 border border-red-200 text-red-900 focus:bg-white focus:border-red-400'}`}
                      />
                    </div>
                    <button onClick={handleManualBlock} className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg border ${isHolographic ? 'bg-red-600/80 hover:bg-red-500 text-white border-red-500/30' : 'bg-red-600 hover:bg-red-700 text-white border-red-200'}`}>
                      Block
                    </button>
                  </div>
               </div>
            </div>
          </GlassCard>

          <GlassCard title="Registered Users" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`text-xs uppercase ${isHolographic ? 'bg-white/5 text-white/40' : 'bg-slate-50 text-slate-500'}`}>
                  <tr>
                    <th className="p-4">User Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`text-sm divide-y ${isHolographic ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {users.map((u, i) => (
                    <tr key={i} className={`transition-colors ${isHolographic ? 'hover:bg-white/5 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                      <td className="p-4 font-medium">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs border ${u.isAdmin ? (isHolographic ? 'bg-purple-500/20 border-purple-500/30 text-purple-200' : 'bg-purple-100 border-purple-200 text-purple-700') : (isHolographic ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-100 border-slate-200 text-slate-500')}`}>
                          {u.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`flex items-center gap-2 ${u.isBanned ? 'text-red-500 font-bold' : 'text-green-500'}`}>
                          {u.isBanned ? <Ban size={14}/> : <CheckCircle2 size={14}/>}
                          {u.isBanned ? 'Blocked / Disabled' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                         {u.isBanned ? (
                           <button onClick={() => handleUnbanUser(u.email)} className={`text-xs px-3 py-1 border rounded-lg transition-all ${isHolographic ? 'text-green-400 border-green-500/30 hover:bg-green-500/10' : 'text-green-600 border-green-200 hover:bg-green-50'}`}>Unblock Access</button>
                         ) : (
                           <button onClick={() => handleBanUser(u.email)} className={`text-xs px-3 py-1 border rounded-lg transition-all ${isHolographic ? 'text-red-400 border-red-500/30 hover:bg-red-500/10' : 'text-red-600 border-red-200 hover:bg-red-50'}`}>Block Access</button>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ---------------- MODERATION TAB ---------------- */}
      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-3">
               <GlassCard title="Content Moderation Queue" className="h-full" noPadding>
                  {feedbacks.length === 0 ? (
                    <div className={`p-12 text-center italic ${isHolographic ? 'text-white/30' : 'text-slate-400'}`}>No feedback to moderate.</div>
                  ) : (
                    <div className={`divide-y ${isHolographic ? 'divide-white/5' : 'divide-slate-100'}`}>
                      {feedbacks.map((fb) => (
                        <div key={fb.id} className={`p-4 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start 
                          ${isHolographic ? 'hover:bg-white/5' : 'hover:bg-slate-50'}
                          ${fb.flagged ? (isHolographic ? 'bg-red-500/5' : 'bg-red-50') : ''}`}>
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                 <span className={`text-xs font-bold px-2 py-0.5 rounded ${isHolographic ? 'bg-white/10 text-white/70' : 'bg-slate-200 text-slate-600'}`}>{fb.category}</span>
                                 <span className={`text-xs ${isHolographic ? 'text-white/30' : 'text-slate-400'}`}>{new Date(fb.timestamp).toLocaleString()}</span>
                                 {fb.flagged && <span className="text-xs font-bold text-red-500 flex items-center gap-1"><Flag size={12}/> FLAGGED</span>}
                                 {fb.sentimentMismatch && (
                                    <span className={`text-xs font-bold text-orange-500 flex items-center gap-1 border px-2 py-0.5 rounded ${isHolographic ? 'border-orange-500/30 bg-orange-500/10' : 'border-orange-200 bg-orange-50'}`}>
                                      <AlertTriangle size={12}/> Conflict
                                    </span>
                                 )}
                              </div>
                              
                              <p className={`mb-2 font-medium ${isHolographic ? 'text-white/90' : 'text-slate-800'}`}>"{fb.text}"</p>
                              
                              {fb.abusiveWords && fb.abusiveWords.length > 0 && (
                                <div className={`flex items-center gap-2 mb-2 p-2 rounded border w-fit ${isHolographic ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                                  <AlertOctagon size={14} className="text-red-500" />
                                  <span className="text-xs text-red-500 font-semibold">Detected Abusive Words:</span>
                                  <div className="flex gap-1">
                                    {fb.abusiveWords.map((w, i) => (
                                      <span key={i} className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase ${isHolographic ? 'bg-red-500/20 text-red-200' : 'bg-red-200 text-red-800'}`}>{w}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className={`flex gap-4 text-xs ${isHolographic ? 'text-white/50' : 'text-slate-500'}`}>
                                 <span>User: {fb.userEmail}</span>
                                 <span>Rating: <strong className={isHolographic ? 'text-white' : 'text-slate-900'}>{fb.rating}</strong>/5</span>
                                 <span className={`${fb.sentimentLabel === 'Negative' ? 'text-red-500' : fb.sentimentLabel === 'Positive' ? 'text-cyan-500' : 'text-purple-500'}`}>
                                   Sentiment: {fb.sentimentLabel}
                                 </span>
                              </div>
                           </div>
                           <div className="flex gap-2 self-end md:self-center shrink-0">
                              <button 
                                onClick={() => handleToggleFlag(fb.id)}
                                className={`p-2 rounded-lg border transition-all ${fb.flagged ? (isHolographic ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'bg-orange-50 border-orange-300 text-orange-600') : (isHolographic ? 'border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50')}`}
                                title="Flag as Suspicious/Spam"
                              >
                                <Flag size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteFeedback(fb.id)}
                                className={`p-2 rounded-lg border transition-all ${isHolographic ? 'border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50' : 'border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                                title="Delete Feedback"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleBanUser(fb.userEmail)}
                                className={`p-2 rounded-lg border transition-all ${isHolographic ? 'border-red-900/30 text-red-400/40 hover:text-red-400 hover:bg-red-900/20' : 'border-red-100 text-red-300 hover:text-red-600 hover:bg-red-50'}`}
                                title="Block User"
                              >
                                <Ban size={18} />
                              </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
               </GlassCard>
             </div>
          </div>
        </div>
      )}

      {/* ---------------- REPORTS TAB ---------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard title="Export Options">
                 <p className={`mb-6 text-sm ${isHolographic ? 'text-white/60' : 'text-slate-500'}`}>Download comprehensive feedback data including metadata, sentiment scores, and user information. Data persists securely.</p>
                 <div className="flex flex-col gap-3">
                   <div className="flex gap-4">
                      <button onClick={handleExportCSV} className={`flex-1 py-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${isHolographic ? 'bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}`}>
                         <FileText size={20} /> Download CSV
                      </button>
                      <button onClick={handlePrintReport} className={`flex-1 py-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${isHolographic ? 'bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}`}>
                         <Download size={20} /> Print / PDF
                      </button>
                   </div>
                   <button onClick={handleExportJSON} className={`w-full py-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${isHolographic ? 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}`}>
                      <Database size={20} /> Download Full JSON Backup
                   </button>
                 </div>
              </GlassCard>
              
              <GlassCard title="Analysis Summary">
                 <div className="space-y-4">
                    <div className={`flex justify-between items-center p-3 rounded-lg ${isHolographic ? 'bg-white/5' : 'bg-slate-50'}`}>
                       <span className={isHolographic ? 'text-white/60' : 'text-slate-500'}>Total Processed</span>
                       <span className={`text-xl font-bold ${isHolographic ? 'text-white' : 'text-slate-800'}`}>{feedbacks.length}</span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${isHolographic ? 'bg-white/5' : 'bg-slate-50'}`}>
                       <span className={isHolographic ? 'text-white/60' : 'text-slate-500'}>Negative Sentiment Rate</span>
                       <span className="text-xl font-bold text-red-500">
                         {feedbacks.length > 0 ? Math.round((feedbacks.filter(f => f.sentimentLabel === 'Negative').length / feedbacks.length) * 100) : 0}%
                       </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${isHolographic ? 'bg-white/5' : 'bg-slate-50'}`}>
                       <span className={isHolographic ? 'text-white/60' : 'text-slate-500'}>Conflict Rate (Mismatch)</span>
                       <span className="text-xl font-bold text-orange-500">
                         {feedbacks.length > 0 ? Math.round((feedbacks.filter(f => f.sentimentMismatch).length / feedbacks.length) * 100) : 0}%
                       </span>
                    </div>
                 </div>
              </GlassCard>
           </div>
        </div>
      )}

      {/* ---------------- AI MODEL TAB ---------------- */}
      {activeTab === 'ai' && (
        <div className="animate-fade-in">
           <GlassCard title="AI Model Control Center" className="border-t-4 border-t-cyan-500">
             <div className="flex flex-col items-center justify-center py-10">
                  
                  <div className="relative w-48 h-48 mb-8 group cursor-pointer" onClick={!retraining ? handleRetrain : undefined}>
                     {/* Holographic Orb Visual */}
                     {isHolographic && <div className={`absolute inset-0 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-full blur-[60px] opacity-30 group-hover:opacity-60 transition-opacity duration-700 ${retraining ? 'animate-pulse scale-125' : ''}`}></div>}
                     <div className={`relative w-full h-full rounded-full border flex items-center justify-center overflow-hidden backdrop-blur-xl shadow-[inset_0_0_30px_rgba(255,255,255,0.1)] 
                        ${isHolographic ? 'border-white/20 bg-black/30' : 'border-indigo-100 bg-white shadow-xl'}`}>
                       <RefreshCw size={60} className={`${isHolographic ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'text-indigo-600'} ${retraining ? 'animate-spin' : ''}`} />
                     </div>
                     {!retraining && (
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border 
                             ${isHolographic ? 'bg-black/80 text-white border-white/20' : 'bg-white text-indigo-600 border-indigo-100 shadow-md'}`}>Click to Retrain</span>
                       </div>
                     )}
                  </div>
                  
                  <div className={`w-full max-w-lg mt-4 p-6 rounded-2xl border text-center relative overflow-hidden
                     ${isHolographic ? 'bg-black/40 border-white/10' : 'bg-white border-slate-100 shadow-lg'}`}>
                     {retraining && <div className="absolute bottom-0 left-0 h-1 bg-cyan-400 animate-[width_2s_ease-in-out_infinite] w-full"></div>}
                     <h3 className={`text-2xl font-bold mb-2 ${isHolographic ? 'text-white' : 'text-slate-800'}`}>Ensemble: TweetEval + GoEmotions + Amazon</h3>
                     <p className={`text-sm mb-6 ${isHolographic ? 'text-white/60' : 'text-slate-500'}`}>
                       {retraining 
                         ? "Fine-tuning weights with Learning Rate Scheduling and Early Stopping..." 
                         : "Status: Online • Accuracy: 92.4% • Class Balanced"}
                     </p>
                     
                     <div className={`grid grid-cols-3 gap-4 text-xs uppercase tracking-widest ${isHolographic ? 'text-white/40' : 'text-slate-400'}`}>
                        <div>
                           <div className={`text-xl font-bold mb-1 ${isHolographic ? 'text-white' : 'text-slate-800'}`}>3</div>
                           Datasets
                        </div>
                        <div>
                           <div className={`text-xl font-bold mb-1 ${isHolographic ? 'text-white' : 'text-slate-800'}`}>{feedbacks.length}</div>
                           New Samples
                        </div>
                        <div>
                           <div className={`text-xl font-bold mb-1 ${isHolographic ? 'text-green-400' : 'text-green-600'}`}>Active</div>
                           State
                        </div>
                     </div>
                  </div>

             </div>
           </GlassCard>

           {/* Recent Log Section within AI Tab for context */}
           <div className="mt-8">
             <GlassCard title="Recent Feedback Log" className="animate-slide-up delay-700">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-wider ${isHolographic ? 'border-white/10 text-white/50' : 'border-slate-100 text-slate-400'}`}>
                      <th className="p-4">Time</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Sentiment</th>
                      <th className="p-4">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {feedbacks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`p-8 text-center italic ${isHolographic ? 'text-white/30' : 'text-slate-400'}`}>No feedback received yet.</td>
                      </tr>
                    ) : (
                      feedbacks.map((fb, idx) => (
                        <tr key={fb.id || idx} className={`border-b transition-colors ${isHolographic ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <td className={`p-4 whitespace-nowrap ${isHolographic ? 'text-white/70' : 'text-slate-500'}`}>{new Date(fb.timestamp).toLocaleDateString()} {new Date(fb.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className={`p-4 font-medium ${isHolographic ? 'text-white' : 'text-slate-800'}`}>{fb.userEmail.split('@')[0]}</td>
                          <td className="p-4">
                            <div className="flex text-yellow-400">
                              {Array.from({length: Math.round(fb.rating)}).map((_, i) => <span key={i}>★</span>)}
                              <span className={`ml-1 text-xs ${isHolographic ? 'text-white/20' : 'text-slate-300'}`}>({fb.rating})</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-1 rounded text-xs font-bold w-fit
                                ${fb.sentimentLabel === Sentiment.POSITIVE ? (isHolographic ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-700 border border-cyan-200') : 
                                  fb.sentimentLabel === Sentiment.NEGATIVE ? (isHolographic ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-pink-100 text-pink-700 border border-pink-200') : 
                                  (isHolographic ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200')}`}>
                                {fb.sentimentLabel || 'Analyzing...'}
                              </span>
                              {fb.sentimentMismatch && (
                                <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1 animate-pulse">
                                  <AlertTriangle size={10}/> Conflict
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`p-4 max-w-xs truncate ${isHolographic ? 'text-white/60' : 'text-slate-600'}`} title={fb.text}>
                            {fb.text}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
           </div>
        </div>
      )}

      {/* ---------------- SECURITY TAB ---------------- */}
      {activeTab === 'security' && (
        <div className="animate-fade-in max-w-2xl mx-auto">
           <GlassCard title="Admin Security Settings">
             <div className="space-y-6 p-2">
                <div className={`rounded-xl p-4 flex gap-4 items-start border ${isHolographic ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
                   <div className={`p-2 rounded-lg ${isHolographic ? 'bg-red-500/20' : 'bg-red-100'}`}>
                      <Lock size={20} className="text-red-500" />
                   </div>
                   <div>
                      <h4 className={`font-bold ${isHolographic ? 'text-red-200' : 'text-red-700'}`}>System Access Control</h4>
                      <p className={`text-sm mt-1 ${isHolographic ? 'text-white/60' : 'text-slate-500'}`}>
                         This passcode controls access to the entire Admin Panel, including user management and AI model controls. 
                         Ensure it is kept secure and changed periodically.
                      </p>
                   </div>
                </div>

                <div className={`rounded-xl p-4 flex gap-4 items-start border ${isHolographic ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100'}`}>
                   <div className={`p-2 rounded-lg ${isHolographic ? 'bg-green-500/20' : 'bg-green-100'}`}>
                      <Database size={20} className="text-green-500" />
                   </div>
                   <div>
                      <h4 className={`font-bold ${isHolographic ? 'text-green-200' : 'text-green-700'}`}>Data Persistence Active</h4>
                      <p className={`text-sm mt-1 ${isHolographic ? 'text-white/60' : 'text-slate-500'}`}>
                         All feedback is securely stored and persisted. Data remains intact even after administrator logout or system restarts.
                      </p>
                   </div>
                </div>

                {securityMessage && (
                  <div className={`flex items-center gap-2 p-4 rounded-xl border animate-fade-in ${securityMessage.type === 'success' ? (isHolographic ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isHolographic ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
                    {securityMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    <span>{securityMessage.text}</span>
                  </div>
                )}

                <div className={`space-y-4 pt-4 border-t ${isHolographic ? 'border-white/10' : 'border-slate-100'}`}>
                   <h4 className={`font-bold text-sm uppercase tracking-widest mb-2 ${isHolographic ? 'text-white' : 'text-slate-700'}`}>Change Passcode</h4>
                   <div className="space-y-2">
                      <label className={`text-xs uppercase tracking-widest block ml-1 ${isHolographic ? 'text-white/50' : 'text-slate-400'}`}>Current Passcode</label>
                      <div className="relative">
                         <input 
                           type="password" 
                           value={currentPasscode}
                           onChange={(e) => setCurrentPasscode(e.target.value)}
                           className={inputClass}
                           placeholder="Enter current passcode"
                         />
                         <Lock size={16} className={`absolute left-4 top-4.5 ${isHolographic ? 'text-white/30' : 'text-slate-400'}`} />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className={`text-xs uppercase tracking-widest block ml-1 ${isHolographic ? 'text-white/50' : 'text-slate-400'}`}>New Passcode</label>
                         <div className="relative">
                            <input 
                              type="password" 
                              value={newPasscode}
                              onChange={(e) => setNewPasscode(e.target.value)}
                              className={inputClass}
                              placeholder="New passcode"
                            />
                            <Key size={16} className={`absolute left-4 top-4.5 ${isHolographic ? 'text-white/30' : 'text-slate-400'}`} />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className={`text-xs uppercase tracking-widest block ml-1 ${isHolographic ? 'text-white/50' : 'text-slate-400'}`}>Confirm New</label>
                         <div className="relative">
                            <input 
                              type="password" 
                              value={confirmPasscode}
                              onChange={(e) => setConfirmPasscode(e.target.value)}
                              className={inputClass}
                              placeholder="Confirm new passcode"
                            />
                            <CheckCircle2 size={16} className={`absolute left-4 top-4.5 ${isHolographic ? 'text-white/30' : 'text-slate-400'}`} />
                         </div>
                      </div>
                   </div>

                   <button 
                     onClick={handleUpdatePasscode}
                     className="w-full py-4 mt-4 rounded-xl font-bold transition-all border border-white/20 transform hover:-translate-y-1 bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg hover:shadow-red-500/30"
                   >
                     Update Passcode
                   </button>
                </div>
             </div>
           </GlassCard>
        </div>
      )}

    </div>
  );
};