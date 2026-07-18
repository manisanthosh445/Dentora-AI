import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, ShieldCheck, Mail, Phone, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('staff'); // staff, patient
  
  // Staff fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Patient fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleStaffLogin = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please enter your email and password.", "warning");
      return;
    }
    
    try {
      const profile = login(email, password);
      showToast(`Welcome back, ${profile.name}! Logging into ${profile.role} console.`, "success");
      navigate('/');
    } catch (err) {
      showToast("Authentication failed.", "error");
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone.trim() || phone.length < 10) {
      showToast("Please enter a valid 10-digit mobile number.", "warning");
      return;
    }
    
    setSendingOtp(true);
    setTimeout(() => {
      setSendingOtp(false);
      setOtpSent(true);
      showToast("OTP sent to mobile successfully! Use code 123456 to verify.", "success");
    }, 1000);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp !== '123456') {
      showToast("Invalid verification OTP. Please try 123456.", "error");
      return;
    }
    
    setVerifying(true);
    setTimeout(() => {
      const profile = login(phone, otp);
      showToast("Logged in successfully!", "success");
      navigate('/');
      setVerifying(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans p-4 text-left">
      {/* Background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-[20px] shadow-2xl border border-blue-50/70 p-8 space-y-6 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Dentora AI Logo" className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-lg shadow-blue-100" />
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Chaitanya Dental Care</h2>
          <p className="text-xs text-slate-550">Enterprise AI Dental Hospital ERP Platform</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
          <button
            onClick={() => {
              setActiveTab('staff');
              setOtpSent(false);
            }}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Clinic Staff Login
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'patient' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Patient Portal
          </button>
        </div>

        {/* Staff Login Form */}
        {activeTab === 'staff' && (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="doctor@chaitanya.com, chief@chaitanya.com..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer mt-2"
            >
              Sign In to Dashboard
            </button>
            
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60 text-[10px] text-blue-700 leading-relaxed font-semibold">
              Tip: Enter <strong>chief@chaitanya.com</strong> or <strong>doctor@chaitanya.com</strong> or <strong>reception@chaitanya.com</strong> to auto-detect roles.
            </div>
          </form>
        )}

        {/* Patient OTP Login Form */}
        {activeTab === 'patient' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="Enter 10-digit phone number..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-55"
                >
                  {sendingOtp ? 'Generating OTP...' : 'Send OTP via SMS'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verify OTP (One Time Password)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code..."
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-center letter-spacing font-bold tracking-widest text-slate-800"
                  />
                  <p className="text-[10px] text-slate-450 text-center font-medium mt-1">
                    Enter the code <strong>123456</strong> sent to +91 {phone}.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-55"
                >
                  {verifying ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Change Mobile Number
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
