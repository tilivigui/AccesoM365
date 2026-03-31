import React from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Calendar as CalendarIcon, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

export const Auth: React.FC = () => {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'User.Read User.Read.All Calendars.ReadWrite Place.Read.All',
      },
    });

    if (error) {
      console.error('Error logging in with Microsoft:', error.message);
      alert('Login error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar Content (Hero) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-blue-600 p-16 text-white relative">
        {/* Abstract Pattern Background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <CalendarIcon size={32} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black tracking-tight">ROOMS<span className="opacity-60">HUB</span></span>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-black leading-[1.1] tracking-tight mb-8">
              Work Together, <br />
              Synchronized.
            </h1>
            <p className="text-xl text-blue-100 max-w-md font-medium leading-relaxed">
              The all-in-one platform to manage meeting room reservations across your organization, integrated directly with Microsoft 365.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6 mt-12">
          {[
            { icon: <CheckCircle2 size={18} />, text: 'Instant Sync' },
            { icon: <ShieldCheck size={18} />, text: 'Approval Flow' },
            { icon: <Clock size={18} />, text: 'Real-time View' },
            { icon: <LogIn size={18} />, text: 'Microsoft SSO' }
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-3 text-blue-50 font-semibold bg-white/10 px-5 py-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-sm">
              <span className="text-blue-200">{feat.icon}</span>
              {feat.text}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content (Login) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-20 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-2 mb-12">
             <CalendarIcon size={24} className="text-blue-600" />
             <span className="text-xl font-black text-slate-900 tracking-tight">ROOMS<span className="text-blue-600">HUB</span></span>
          </div>

          <header className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Get Started</h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">
              Login with your organization credentials to manage and book meeting rooms.
            </p>
          </header>

          <div className="space-y-6">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-4 px-6 py-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-200 hover:-translate-y-0.5 active:scale-[0.98] focus:ring-4 focus:ring-slate-200 group"
            >
              <img
                src="https://www.microsoft.com/favicon.ico"
                className="w-6 h-6 object-contain"
                alt="Microsoft Logo"
              />
              <span className="text-lg">Continue with Microsoft</span>
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Enterprise Secured</span></div>
            </div>

            <p className="text-slate-400 text-center text-sm font-medium">
              By continuing, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>

        <footer className="mt-auto pt-10 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
          &copy; 2026 ROOMSHUB ENTERPRISE
        </footer>
      </div>
    </div>
  );
};
