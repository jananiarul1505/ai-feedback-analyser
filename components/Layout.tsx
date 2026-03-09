import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquarePlus, Settings, ShieldCheck, LogOut, Menu, X, ArrowLeft, BarChart3, User, PieChart } from 'lucide-react';
import { logout, auth } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import { dataService } from '../services/data';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isHolographic } = useTheme();

  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      if (auth.currentUser && auth.currentUser.email) {
        const user = dataService.getUser(auth.currentUser.email);
        setIsUserAdmin(!!user?.isAdmin);
      }
    };
    
    checkAdminStatus();
    const unsubscribe = dataService.subscribe(checkAdminStatus);
    return () => unsubscribe();
  }, []);

  const navItems = [
    { label: 'Feedback', path: '/feedback', icon: <MessageSquarePlus size={20} /> },
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Admin Panel', path: '/admin', icon: <ShieldCheck size={20} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showBack = location.pathname !== '/feedback';

  return (
    <div className={`min-h-screen flex relative overflow-hidden font-sans transition-colors duration-500 ${isHolographic ? 'text-slate-200' : 'text-slate-600'}`}>
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-5 right-5 z-50 p-2.5 rounded-full transition-colors 
          ${isHolographic 
            ? 'bg-black/40 backdrop-blur-md border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
            : 'bg-white text-indigo-600 shadow-lg border border-indigo-100 hover:bg-indigo-50'}`}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Floating Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        h-screen p-4 flex flex-col
      `}>
        {/* Container for Sidebar */}
        <div className={`h-full flex flex-col rounded-3xl overflow-hidden relative transition-all duration-500
          ${isHolographic 
            ? 'bg-black/20 backdrop-blur-2xl border border-white/10 shadow-2xl' 
            : 'bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]'}
        `}>
           
           {/* Sidebar Decor - Top Glow */}
           {isHolographic && <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-cyan-900/20 via-transparent to-transparent pointer-events-none" />}

           <div className="p-6 pb-2 relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
                ${isHolographic 
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.4)] text-white' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 text-white'}
              `}>
                <PieChart size={22} className="text-white" />
              </div>
              <div>
                <h1 className={`text-lg font-bold tracking-tight ${isHolographic ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : 'text-slate-800'}`}>AI Feedback</h1>
              </div>
            </div>
            <p className={`text-[10px] pl-1 uppercase tracking-widest font-semibold ${isHolographic ? 'text-cyan-400/70' : 'text-slate-400'}`}>
              Intelligence Platform
            </p>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto relative z-10">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative
                    ${isActive 
                      ? (isHolographic 
                          ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200')
                      : (isHolographic 
                          ? 'text-slate-400 hover:bg-white/5 hover:text-white' 
                          : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600')}
                  `}
                >
                  {/* Holo Active Indicator */}
                  {isActive && isHolographic && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_cyan]"></div>}
                  
                  <span className={`${isActive ? '' : 'group-hover:scale-110 transition-transform'} ${isHolographic && isActive ? 'text-cyan-300' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium text-sm tracking-wide">{item.label}</span>
                  
                  {isActive && isHolographic && <div className="absolute inset-0 rounded-xl bg-cyan-400/5 pointer-events-none"></div>}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t relative z-10 border-transparent">
             {/* Divider Color */}
             <div className={`absolute top-0 left-4 right-4 h-px ${isHolographic ? 'bg-white/5' : 'bg-slate-100'}`}></div>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all 
                ${isHolographic 
                  ? 'text-red-300 hover:bg-red-900/20 hover:text-red-100 hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]' 
                  : 'text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
            >
              <LogOut size={18} />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto h-screen relative scroll-smooth">
        <div className="max-w-7xl mx-auto pb-10">
          {/* Header Row: Back Button (Left) & User Profile (Right) */}
          <div className="flex justify-between items-center mb-8 sticky top-0 z-30 py-2">
            <div>
              {showBack ? (
                <button 
                  onClick={() => navigate(-1)}
                  className={`flex items-center gap-2 transition-all hover:-translate-x-1 px-4 py-2 rounded-full w-fit backdrop-blur-md
                    ${isHolographic 
                      ? 'text-white bg-black/20 border border-white/10 hover:border-cyan-500/50 hover:text-cyan-300' 
                      : 'text-slate-600 bg-white/60 border border-white/60 hover:bg-white hover:text-indigo-600 shadow-sm'}
                  `}
                >
                  <ArrowLeft size={16} />
                  <span className="text-sm font-medium">Back</span>
                </button>
              ) : <div className="h-9"></div>}
            </div>

            {/* User Profile Corner Display */}
            {auth.currentUser && (
              <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all backdrop-blur-md 
                ${isHolographic 
                  ? 'bg-black/30 border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.2)]' 
                  : 'bg-white/60 border-white/60 shadow-sm'}`}>
                <div className="text-right hidden sm:block pl-2">
                   <div className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${isHolographic ? 'text-slate-400' : 'text-slate-400'}`}>User</div>
                   <div className={`text-xs font-bold truncate max-w-[120px] ${isHolographic ? 'text-cyan-100' : 'text-slate-800'}`}>
                     {auth.currentUser.displayName || auth.currentUser.email?.split('@')[0]}
                   </div>
                </div>
                <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 
                  ${isHolographic 
                    ? 'bg-gradient-to-tr from-cyan-500 to-purple-500 p-[1px]' 
                    : 'bg-gradient-to-tr from-indigo-500 to-purple-600 p-[1px]'}`}>
                   <div className={`w-full h-full rounded-full overflow-hidden ${isHolographic ? 'bg-black/50' : 'bg-white'}`}>
                     {auth.currentUser.photoURL ? (
                       <img src={auth.currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                     ) : (
                       <User size={16} className={isHolographic ? "text-white w-full h-full p-1.5" : "text-indigo-600 w-full h-full p-1.5"} />
                     )}
                   </div>
                </div>
              </div>
            )}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};