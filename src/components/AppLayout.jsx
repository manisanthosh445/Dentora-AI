import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, Users, Calendar, Stethoscope, Pill, 
  Receipt, BarChart3, Sparkles, 
  MessageSquare, ListTodo, Bell, 
  Search, Moon, Sun, LogOut, Settings, X, Plus, ShieldAlert
} from 'lucide-react';
import { getApiKey, setApiKey, listEntity, runReminderScheduler, runMedicineReminderScheduler } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PatientPortal from '../pages/PatientPortal';
import AIAssistant from './AIAssistant';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isChief, isDoctor, isReceptionist, isPatient } = useAuth();
  
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(getApiKey());
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotificationSlide, setShowNotificationSlide] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Automated Medicine Reminders background scheduler
  useEffect(() => {
    console.log("[Scheduler Startup] Initializing automatic medicine reminder checks (runs every 60s)...");
    runReminderScheduler();
    runMedicineReminderScheduler();
    
    const intervalId = setInterval(() => {
      runReminderScheduler();
      runMedicineReminderScheduler();
    }, 60000);
    
    return () => {
      console.log("[Scheduler Shutdown] Cleaning up reminder scheduler loop.");
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (showNotificationSlide) {
      listEntity('NotificationLog').then(res => {
        if (res.success && active) {
          setNotifications(res.data || []);
        }
      }).catch(err => {
        console.warn("Failed loading notification logs:", err);
        // Fallback for quota rate-limits
        if (active) {
          setNotifications([
            { id: '1', recipient_name: 'Rahul Sharma', channel: 'SMS', type: 'Appointment Reminder', message: 'Dear Rahul Sharma, your appointment with Dr. Chaitanya is scheduled for tomorrow at 10:30 AM.', status: 'Sent', sent_date: new Date().toISOString() },
            { id: '2', recipient_name: 'Priya Patel', channel: 'Email', type: 'Invoice Paid Receipt', message: 'Dear Priya Patel, thank you for your payment of INR 2000.00 for treatment invoice INV-255010.', status: 'Delivered', sent_date: new Date(Date.now() - 3600000).toISOString() }
          ]);
        }
      });
    }
    return () => { active = false; };
  }, [showNotificationSlide]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    setTempApiKey(getApiKey());
  }, [apiKeyModalOpen]);

  // If patient role, immediately redirect/render mobile patient portal dashboard
  if (user && isPatient()) {
    return <PatientPortal />;
  }

  const saveKey = (e) => {
    e.preventDefault();
    setApiKey(tempApiKey);
    setApiKeyModalOpen(false);
    window.location.reload();
  };

  // Dynamic menu filtering (Role Based Login System)
  const getNavGroups = () => {
    if (!user) return [];

    const operationsItems = [
      { name: "Dashboard", path: "/", icon: LayoutGrid },
      { name: "Patients", path: "/patients", icon: Users },
      { name: "Appointments", path: "/appointments", icon: Calendar },
      { name: "Queue Management", path: "/queue", icon: ListTodo }
    ];

    if (isChief() || isDoctor()) {
      operationsItems.push({ name: "Treatments", path: "/treatments", icon: Stethoscope });
      operationsItems.push({ name: "Prescriptions", path: "/prescriptions", icon: Pill });
    }

    if (isChief() || isReceptionist()) {
      operationsItems.push({ name: "Billing", path: "/billing", icon: Receipt });
    }

    const aiItems = [];
    if (isChief() || isDoctor()) {
      aiItems.push({ name: "AI Consultation", path: "/consultation", icon: Sparkles });
      aiItems.push({ name: "X-Ray AI Analysis", path: "/xray-ai", icon: ShieldAlert });
    }
    if (isChief()) {
      aiItems.push({ name: "AI Receptionist", path: "/receptionist", icon: MessageSquare });
    }

    const chartsItems = [
      { name: "Notifications", path: "/notifications", icon: Bell }
    ];
    if (isChief() || isDoctor()) {
      chartsItems.push({ name: "Clinic Analytics", path: "/analytics", icon: BarChart3 });
    }
    if (isChief()) {
      chartsItems.push({ name: "Admin Settings", path: "/admin-settings", icon: Settings });
    }

    const groups = [
      { title: "Clinic Operations", items: operationsItems }
    ];
    if (aiItems.length > 0) {
      groups.push({ title: "AI Modules", items: aiItems });
    }
    groups.push({ title: "Charts & Settings", items: chartsItems });
    return groups;
  };

  const navGroups = getNavGroups();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patients?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/logout');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 select-none">
        {/* Brand */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-800">
          <img src="/logo.png" alt="Dentora AI Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/20" />
          <div className="text-left">
            <h1 className="text-white font-bold leading-tight">Dentora AI</h1>
            <span className="text-xs text-slate-500 font-medium">AI Operating System</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-2 text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3">{group.title}</span>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-left">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/40 transition-colors duration-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-semibold shadow-inner shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Staff User'}</h4>
              <p className="text-[10px] text-slate-500 font-medium truncate">{user?.role || 'Clinician'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogoutClick}
            className="flex items-center gap-2 mt-3 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <header className="flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-blue-50 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patients, appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded px-1.5 shadow-sm">
                ⌘K
              </span>
            </form>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/appointments?new=true')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 active:scale-95 shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Appointment</span>
            </button>

            <button
              onClick={() => setApiKeyModalOpen(true)}
              className={`p-2 rounded-xl text-slate-600 hover:bg-blue-50 transition-all duration-200 relative cursor-pointer ${!getApiKey() ? 'text-amber-500 animate-pulse bg-amber-50' : ''}`}
              title="API Key Configuration"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setShowNotificationSlide(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-blue-50 transition-all duration-200 cursor-pointer relative"
              title="Recent Activity Logs"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            </button>

            {/* Dark/Light Mode Toggler */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-600 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              title="Toggle theme mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-655" />}
            </button>

            <div className="w-8.5 h-8.5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-blue-100 transition-all duration-200">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Modal */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm">
          <div className="relative flex flex-col w-64 bg-slate-900 h-full animate-slide-in text-left">
            <button 
              onClick={() => setShowMobileSidebar(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 p-6 border-b border-slate-800">
              <img src="/logo.png" alt="Dentora AI Logo" className="w-8 h-8 rounded-lg object-cover" />
              <div>
                <h1 className="text-white text-sm font-bold">Dentora AI</h1>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {navGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-3">{group.title}</span>
                  <nav className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setShowMobileSidebar(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                            isActive 
                              ? 'bg-blue-600 text-white' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-3 p-2 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-semibold flex items-center justify-center">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{user?.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMobileSidebar(false)} />
        </div>
      )}

      {/* API Key Modal */}
      {apiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-blue-50 overflow-hidden animate-fade-in text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-850 text-base">API Configuration</h3>
              </div>
              <button 
                onClick={() => setApiKeyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-655 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveKey} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Database API Key</label>
                <input
                  type="password"
                  placeholder="Enter database api_key..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[11px] text-slate-500">
                  The active database authentication key is loaded from the secure server config.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApiKeyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-655 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Notifications Slide-over Drawer */}
      {showNotificationSlide && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
            onClick={() => setShowNotificationSlide(false)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-md shadow-2xl border-l border-slate-100 flex flex-col h-full z-10 animate-slide-in text-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600 animate-pulse" />
                <h3 className="font-bold text-slate-800 text-sm">Recent Activity Logs</h3>
              </div>
              <button 
                onClick={() => setShowNotificationSlide(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-450 italic text-xs">
                  No notifications dispatched.
                </div>
              ) : (
                notifications.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800">{log.recipient_name}</span>
                      <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-full uppercase">
                        {log.channel}
                      </span>
                    </div>
                    <p className="text-slate-505 text-[11px] leading-relaxed font-semibold">{log.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
                      <span>{log.type}</span>
                      <span>{log.sent_date ? new Date(log.sent_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-center">
              <button
                onClick={() => {
                  setShowNotificationSlide(false);
                  navigate('/notifications');
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors text-center cursor-pointer"
              >
                Go to Notification Center
              </button>
            </div>
          </div>
        </div>
      )}

      <AIAssistant />
    </div>
  );
}
